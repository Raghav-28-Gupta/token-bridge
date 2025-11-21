import express, { type Request, type Response, type NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import { z } from "zod";
import { config } from "./config.js";
import { logger } from "./logger.js";
import {
	getRecentEvents,
	getEventsByChain,
	getEventsByAddress,
	getTransfersByAddress,
	getTransferByDepositHash,
	getPendingTransfers,
	prisma,
} from "./db.js";

const app = express();

// Simplified Middleware
app.use(cors({ origin: config.api.corsOrigin }));
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
	if (req.url !== "/health") {
		logger.info(`${req.method} ${req.url}`);
	}
	next();
});

// Validation schemas
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const chainIdSchema = z.number().int().positive();
const limitSchema = z.number().int().min(1).max(100).default(50);

// Health Check
app.get("/health", (req: Request, res: Response) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Events Endpoints

/**
 * GET /events
 * Get recent bridge events
 */
app.get("/events", async (req: Request, res: Response) => {
	const limit = limitSchema.parse(parseInt(req.query.limit as string) || 50);
	const events = await getRecentEvents(limit);

	res.json({
		success: true,
		data: events,
		count: events.length,
	});
});

/**
 * GET /events/chain/:chainId
 * Get events for specific chain
 */
app.get("/events/chain/:chainId", async (req: Request, res: Response) => {
	const chainId = chainIdSchema.parse(parseInt(req.params.chainId!));
	const limit = limitSchema.parse(parseInt(req.query.limit as string) || 50);

	const events = await getEventsByChain(chainId, limit);

	res.json({
		success: true,
		data: events,
		count: events.length,
	});
});

/**
 * GET /events/address/:address
 * Get events for specific address
 */
app.get("/events/address/:address", async (req: Request, res: Response) => {
	const address = addressSchema.parse(req.params.address!.toLowerCase());
	const limit = limitSchema.parse(parseInt(req.query.limit as string) || 50);

	const events = await getEventsByAddress(address, limit);

	res.json({
		success: true,
		data: events,
		count: events.length,
	});
});

// Transfer Endpoints

/**
 * GET /transfers
 * Get recent transfers
 */
app.get("/transfers", async (req: Request, res: Response) => {
	const limit = limitSchema.parse(parseInt(req.query.limit as string) || 50);
	const status = req.query.status as string | undefined;

	const where = status ? { status } : {};

	const transfers = await prisma.transfer.findMany({
		where,
		take: limit,
		orderBy: { depositTime: "desc" },
	});

	res.json({
		success: true,
		data: transfers,
		count: transfers.length,
	});
});

/**
 * GET /transfers/pending
 * Get pending transfers
 */
app.get("/transfers/pending", async (req: Request, res: Response) => {
	const transfers = await getPendingTransfers();

	res.json({
		success: true,
		data: transfers,
		count: transfers.length,
	});
});

/**
 * GET /transfers/address/:address
 * Get transfers for specific address
 */
app.get("/transfers/address/:address", async (req: Request, res: Response) => {
	const address = addressSchema.parse(req.params.address!.toLowerCase());
	const limit = limitSchema.parse(parseInt(req.query.limit as string) || 50);

	const transfers = await getTransfersByAddress(address, limit);

	res.json({
		success: true,
		data: transfers,
		count: transfers.length,
	});
});

/**
 * GET /transfers/tx/:txHash
 * Get transfer by deposit transaction hash
 */
app.get("/transfers/tx/:txHash", async (req: Request, res: Response) => {
	const txHash = txHashSchema.parse(req.params.txHash!.toLowerCase());

	const transfer = await getTransferByDepositHash(txHash);

	if (!transfer) {
		return res.status(404).json({
			success: false,
			error: "Transfer not found",
		});
	}

	res.json({
		success: true,
		data: transfer,
	});
});

// Error Handling

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error({ err, path: req.path }, "API error");

	if (err instanceof z.ZodError) {
		return res.status(400).json({
			success: false,
			error: "Validation error",
			details: err.issues,
		});
	}

	res.status(500).json({
		success: false,
		error: "Internal server error",
		message: err.message,
	});
});

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({
		success: false,
		error: "Not found",
		path: req.path,
	});
});

export function startAPI(): Promise<void> {
	return new Promise((resolve) => {
		app.listen(config.api.port, config.api.host, () => {
			logger.info(
				`API server started on ${config.api.host}:${config.api.port}`
			);
			resolve();
		});
	});
}

export default app;
