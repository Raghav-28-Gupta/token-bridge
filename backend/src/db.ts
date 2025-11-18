import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
	log: [
		{ level: "error", emit: "event" },
		{ level: "warn", emit: "event" },
	],
});

// Log database errors
prisma.$on("error" as never, (e: any) => {
	logger.error({ err: e }, "Database error");
});

prisma.$on("warn" as never, (e: any) => {
	logger.warn({ warning: e }, "Database warning");
});

export async function connectDatabase(): Promise<void> {
	try {
		await prisma.$connect();
		logger.info("Database connected successfully");
	} catch (error) {
		logger.error({ err: error }, "Failed to connect to database");
		throw error;
	}
}

export async function disconnectDatabase(): Promise<void> {
	await prisma.$disconnect();
	logger.info("Database disconnected");
}

// Helper functions for common queries
export async function getOrCreateTransaction(data: {
	txHash: string;
	sourceChain: number;
	targetChain: number;
	token: string;
	sender: string;
	recipient: string;
	amount: string;
	nonce: number;
	blockNumber: number;
}) {
	return await prisma.bridgeTransaction.upsert({
		where: { txHash: data.txHash },
		update: {},
		create: {
			txHash: data.txHash,
			sourceChain: data.sourceChain,
			targetChain: data.targetChain,
			token: data.token,
			sender: data.sender,
			recipient: data.recipient,
			amount: data.amount,
			nonce: data.nonce,
			blockNumber: data.blockNumber,
			status: "pending",
		},
	});
}

export async function updateTransactionStatus(
	txHash: string,
	status: string,
	targetTxHash?: string
) {
	return await prisma.bridgeTransaction.update({
		where: { txHash },
		data: {
			status,
			...(targetTxHash && { targetTxHash }),
		},
	});
}

export async function getPendingTransactions(sourceChain: number) {
	return await prisma.bridgeTransaction.findMany({
		where: {
			sourceChain,
			status: {
				in: ["pending", "relaying"],
			},
		},
		orderBy: {
			blockNumber: "asc",
		},
	});
}

export async function markTransactionAsRelaying(txHash: string) {
	return await updateTransactionStatus(txHash, "relaying");
}

export async function markTransactionAsCompleted(
	txHash: string,
	targetTxHash: string
) {
	return await updateTransactionStatus(txHash, "completed", targetTxHash);
}

export async function markTransactionAsFailed(txHash: string, error: string) {
	return await prisma.bridgeTransaction.update({
		where: { txHash },
		data: {
			status: "failed",
			error,
		},
	});
}

export async function getLastProcessedBlock(chainId: number): Promise<number> {
	const lastTx = await prisma.bridgeTransaction.findFirst({
		where: { sourceChain: chainId },
		orderBy: { blockNumber: "desc" },
		select: { blockNumber: true },
	});

	return lastTx?.blockNumber || 0;
}
