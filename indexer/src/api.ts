import express, { type Request, type Response, type NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import * as pinoHttp from "pino-http";
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
	getTotalVolume,
	getVolumeByChain,
	getChainSyncStatus,
	prisma,
} from "./db.js";

const app = express();

// Middleware
app.use(cors({ origin: config.api.corsOrigin }));
app.use(express.json());
app.use(
	(pinoHttp as any).default({
          logger,
          autoLogging: { ignore: (req: { url: string }) => req.url === "/health" },
     })
);

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

// Stats Endpoints

/**
 * GET /stats
 * Get overall bridge statistics
 */
app.get("/stats", async (req: Request, res: Response) => {
	const [totalTransfers, chainSyncStatus] = await Promise.all([
		getTotalVolume(),
		getChainSyncStatus(),
	]);

	// Calculate volume by chain
	const volumeByChain: Record<number, any> = {};
	for (const chain of chainSyncStatus) {
		volumeByChain[chain.chainId] = await getVolumeByChain(chain.chainId);
	}

	res.json({
		success: true,
		data: {
			totalTransfers,
			chainSyncStatus,
			volumeByChain,
		},
	});
});

/**
 * GET /stats/chain/:chainId
 * Get statistics for specific chain
 */
app.get("/stats/chain/:chainId", async (req: Request, res: Response) => {
	const chainId = chainIdSchema.parse(parseInt(req.params.chainId!));

	const volume = await getVolumeByChain(chainId);
	const syncStatus = await prisma.chainSync.findUnique({
		where: { chainId },
	});

	res.json({
		success: true,
		data: {
			chainId,
			volume,
			syncStatus,
		},
	});
});

/**
 * GET /stats/volume
 * Get volume statistics
 */
app.get("/stats/volume", async (req: Request, res: Response) => {
	// Get completed transfers grouped by token
	const volumeByToken = await prisma.bridgeEvent.groupBy({
		by: ["token"],
		where: { eventType: "Deposit" },
		_count: true,
	});

	// Get daily volume
	const now = new Date();
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const last24Hours = await prisma.transfer.count({
		where: {
			depositTime: {
				gte: yesterday,
			},
		},
	});

	res.json({
		success: true,
		data: {
			volumeByToken,
			last24Hours,
		},
	});
});

// Sync Status Endpoints

/**
 * GET /sync
 * Get sync status for all chains
 */
app.get("/sync", async (req: Request, res: Response) => {
	const syncStatus = await getChainSyncStatus();

	res.json({
		success: true,
		data: syncStatus,
	});
});

/**
 * GET /sync/:chainId
 * Get sync status for specific chain
 */
app.get("/sync/:chainId", async (req: Request, res: Response) => {
	const chainId = chainIdSchema.parse(parseInt(req.params.chainId!));

	const syncStatus = await prisma.chainSync.findUnique({
		where: { chainId },
	});

	if (!syncStatus) {
		return res.status(404).json({
			success: false,
			error: "Chain not found",
		});
	}

	res.json({
		success: true,
		data: syncStatus,
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
				{ port: config.api.port, host: config.api.host },
				"API server started"
			);
			resolve();
		});
	});
}

export default app;
