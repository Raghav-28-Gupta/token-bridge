import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient({
	log: [
		{ level: "error", emit: "event" },
		{ level: "warn", emit: "event" },
	],
});

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

// Chain Sync Functions
export async function getOrCreateChainSync(
	chainId: number,
	chainName: string,
	startBlock: number
) {
	return await prisma.chainSync.upsert({
		where: { chainId },
		update: {},
		create: {
			chainId,
			chainName,
			lastBlockNumber: startBlock,
			lastBlockHash: "0x0",
			totalEvents: 0,
		},
	});
}

export async function updateChainSync(
	chainId: number,
	blockNumber: number,
	blockHash: string,
	eventCount: number
) {
	return await prisma.chainSync.update({
		where: { chainId },
		data: {
			lastBlockNumber: blockNumber,
			lastBlockHash: blockHash,
			lastSyncedAt: new Date(),
			totalEvents: {
				increment: eventCount,
			},
		},
	});
}

export async function getLastSyncedBlock(chainId: number): Promise<number> {
	const sync = await prisma.chainSync.findUnique({
		where: { chainId },
		select: { lastBlockNumber: true },
	});
	return sync?.lastBlockNumber || 0;
}

// Event Functions
export async function createBridgeEvent(data: {
	txHash: string;
	logIndex: number;
	eventType: string;
	chainId: number;
	blockNumber: number;
	blockHash: string;
	timestamp: Date;
	token: string;
	sender?: string;
	recipient: string;
	amount: string;
	nonce: number;
	sourceChainId?: number;
	targetChainId?: number;
}) {
	return await prisma.bridgeEvent.create({ data });
}

export async function eventExists(
	txHash: string,
	logIndex: number
): Promise<boolean> {
	const event = await prisma.bridgeEvent.findUnique({
		where: {
			txHash_logIndex: { txHash, logIndex },
		},
	});
	return !!event;
}

// Transfer Functions
export async function createOrUpdateTransfer(data: {
	depositTxHash: string;
	withdrawTxHash?: string;
	sourceChainId: number;
	targetChainId: number;
	token: string;
	sender: string;
	recipient: string;
	amount: string;
	nonce: number;
	depositBlock: number;
	withdrawBlock?: number;
	depositTime: Date;
	withdrawTime?: Date;
	status: string;
}) {
	const update: Record<string, unknown> = { status: data.status };

     if (data.withdrawTxHash !== undefined) update.withdrawTxHash = data.withdrawTxHash;
     if (data.withdrawBlock !== undefined) update.withdrawBlock = data.withdrawBlock;
     if (data.withdrawTime !== undefined) update.withdrawTime = data.withdrawTime;

     return await prisma.transfer.upsert({
          where: { depositTxHash: data.depositTxHash },
          update,
          create: data,
     });
}

export async function getTransferByDepositHash(txHash: string) {
	return await prisma.transfer.findUnique({
		where: { depositTxHash: txHash },
	});
}

export async function updateTransferWithWithdraw(
	depositTxHash: string,
	withdrawTxHash: string,
	withdrawBlock: number,
	withdrawTime: Date
) {
	return await prisma.transfer.update({
		where: { depositTxHash },
		data: {
			withdrawTxHash,
			withdrawBlock,
			withdrawTime,
			status: "completed",
		},
	});
}

// Query Functions
export async function getRecentEvents(limit: number = 50) {
	return await prisma.bridgeEvent.findMany({
		take: limit,
		orderBy: { blockNumber: "desc" },
	});
}

export async function getEventsByChain(chainId: number, limit: number = 50) {
	return await prisma.bridgeEvent.findMany({
		where: { chainId },
		take: limit,
		orderBy: { blockNumber: "desc" },
	});
}

export async function getEventsByAddress(address: string, limit: number = 50) {
	return await prisma.bridgeEvent.findMany({
		where: {
			OR: [
				{ sender: address.toLowerCase() },
				{ recipient: address.toLowerCase() },
			],
		},
		take: limit,
		orderBy: { blockNumber: "desc" },
	});
}

export async function getTransfersByAddress(
	address: string,
	limit: number = 50
) {
	return await prisma.transfer.findMany({
		where: {
			OR: [
				{ sender: address.toLowerCase() },
				{ recipient: address.toLowerCase() },
			],
		},
		take: limit,
		orderBy: { depositTime: "desc" },
	});
}

export async function getTransferByNonce(
	nonce: number,
	sourceChainId: number,
	targetChainId: number
) {
	return await prisma.transfer.findFirst({
		where: { nonce, sourceChainId, targetChainId },
	});
}

export async function getPendingTransfers() {
	return await prisma.transfer.findMany({
		where: { status: "pending" },
		orderBy: { depositTime: "asc" },
	});
}

// Stats Functions
export async function getTotalVolume() {
	const result = await prisma.transfer.aggregate({
		where: { status: "completed" },
		_count: true,
	});
	return result._count;
}

export async function getVolumeByChain(chainId: number) {
	const deposits = await prisma.bridgeEvent.count({
		where: { chainId, eventType: "Deposit" },
	});

	const withdraws = await prisma.bridgeEvent.count({
		where: { chainId, eventType: "Withdraw" },
	});

	return { deposits, withdraws, total: deposits + withdraws };
}

export async function getChainSyncStatus() {
	return await prisma.chainSync.findMany({
		orderBy: { chainId: "asc" },
	});
}
