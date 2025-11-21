import { ethers } from "ethers";
import { config, getChainConfig, getAllChainIds } from "./config.js";
import { logger } from "./logger.js";
import {
	getOrCreateChainSync,
	updateChainSync,
	getLastSyncedBlock,
} from "./db.js";
import { EventProcessor } from "./event-processor.js";
import { retry, sleep } from "./utils.js";
import { BridgeABI } from "@bridge/shared";

const BRIDGE_ABI = BridgeABI;


interface ChainIndexer {
	chainId: number;
	provider: ethers.Provider;
	contract: ethers.Contract;
	processor: EventProcessor;
	lastBlock: number;
}

export class BridgeIndexer {
	private indexers: Map<number, ChainIndexer> = new Map();
	private isRunning = false;
	private processor = new EventProcessor();

	async initialize(): Promise<void> {
		logger.info("Initializing bridge indexer...");

		const chainIds = getAllChainIds();

		for (const chainId of chainIds) {
			await this.initializeChain(chainId);
		}

		logger.info({ chains: chainIds }, "Bridge indexer initialized");
	}

	private async initializeChain(chainId: number): Promise<void> {
		const chainConfig = getChainConfig(chainId);

		logger.info(
			{ chainId, name: chainConfig.name },
			"Initializing chain indexer"
		);

		const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
		const contract = new ethers.Contract(
			chainConfig.bridgeAddress,
			BRIDGE_ABI,
			provider
		);

		// Initialize or get chain sync state
		await getOrCreateChainSync(
			chainId,
			chainConfig.name,
			chainConfig.startBlock
		);

		const lastBlock = await getLastSyncedBlock(chainId);

		this.indexers.set(chainId, {
			chainId,
			provider,
			contract,
			processor: this.processor,
			lastBlock: lastBlock || chainConfig.startBlock,
		});

		logger.info(
			{
				chainId,
				name: chainConfig.name,
				lastBlock,
				bridge: chainConfig.bridgeAddress,
			},
			"Chain indexer initialized"
		);
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Indexer already running");
			return;
		}

		this.isRunning = true;
		logger.info("Starting bridge indexer...");

		// Start indexing each chain
		const promises = Array.from(this.indexers.keys()).map((chainId) =>
			this.indexChain(chainId)
		);

		await Promise.all(promises);
	}

	async stop(): Promise<void> {
		logger.info("Stopping bridge indexer...");
		this.isRunning = false;
	}

	private async indexChain(chainId: number): Promise<void> {
		const chainConfig = getChainConfig(chainId);
		logger.info(
			{ chainId, name: chainConfig.name },
			"Starting chain indexer"
		);

		while (this.isRunning) {
			try {
				await this.processChainEvents(chainId);
				await sleep(config.indexing.pollInterval);
			} catch (error) {
				logger.error(
					{ err: error, chainId, chain: chainConfig.name },
					"Error processing chain events"
				);
				await sleep(config.indexing.pollInterval * 2);
			}
		}
	}

	private async processChainEvents(chainId: number): Promise<void> {
		const indexer = this.indexers.get(chainId);
		if (!indexer) return;

		const currentBlock = await retry(() => indexer.provider.getBlockNumber());
		const fromBlock = indexer.lastBlock + 1;
		const toBlock = Math.min(
			fromBlock + config.indexing.batchSize,
			currentBlock
		);

		if (fromBlock > toBlock) {
			return; // No new blocks
		}

		logger.debug(
			{ chainId, fromBlock, toBlock, currentBlock },
			"Querying events"
		);

		// Process Deposit events
		await this.processEventType(indexer, "Deposit", fromBlock, toBlock);

		// Process Withdraw events
		await this.processEventType(indexer, "Withdraw", fromBlock, toBlock);

		// Update sync state
		const block = await indexer.provider.getBlock(toBlock);
		if (block) {
			const totalEvents = await this.getEventCountInRange(
				indexer,
				fromBlock,
				toBlock
			);

			await updateChainSync(chainId, toBlock, block.hash!, totalEvents);

			indexer.lastBlock = toBlock;

			logger.info(
				{
					chainId,
					fromBlock,
					toBlock,
					currentBlock,
					events: totalEvents,
				},
				"Indexed blocks"
			);
		}
	}

	private async processEventType(
		indexer: ChainIndexer,
		eventType: "Deposit" | "Withdraw",
		fromBlock: number,
		toBlock: number
	): Promise<void> {
		try {
			const filter = indexer.contract.filters[eventType]!();
			const events = await retry(() =>
				indexer.contract.queryFilter(filter, fromBlock, toBlock)
			);

			if (events.length > 0) {
				logger.info(
					{
						chainId: indexer.chainId,
						eventType,
						count: events.length,
						fromBlock,
						toBlock,
					},
					`Found ${eventType} events`
				);

				await indexer.processor.processBatch(
					events as ethers.EventLog[],
					indexer.chainId,
					indexer.provider,
					eventType
				);
			}
		} catch (error) {
			logger.error(
				{
					err: error,
					chainId: indexer.chainId,
					eventType,
					fromBlock,
					toBlock,
				},
				`Failed to process ${eventType} events`
			);
			throw error;
		}
	}

	private async getEventCountInRange(
		indexer: ChainIndexer,
		fromBlock: number,
		toBlock: number
	): Promise<number> {
		try {
			if (!indexer.contract || !indexer.contract.filters) {
				logger.warn({ chainId: indexer.chainId }, "Contract or filters not available");
				return 0;
			}

			const depositFilter = indexer.contract.filters.Deposit?.();
			const withdrawFilter = indexer.contract.filters.Withdraw?.();

			if (!depositFilter || !withdrawFilter) {
				logger.warn({ chainId: indexer.chainId }, "Deposit or Withdraw filter not found in ABI");
				return 0;
			}

			const [deposits, withdraws] = await Promise.all([
				indexer.contract.queryFilter(depositFilter, fromBlock, toBlock),
				indexer.contract.queryFilter(withdrawFilter, fromBlock, toBlock),
			]);

			return deposits.length + withdraws.length;
		} catch (error) {
			logger.error(
				{ err: error, fromBlock, toBlock },
				"Failed to count events"
			);
			return 0;
		}
	}

	// async syncFromBlock(chainId: number, fromBlock: number): Promise<void> {
	// 	const indexer = this.indexers.get(chainId);
	// 	if (!indexer) {
	// 		throw new Error(`Chain ${chainId} not initialized`);
	// 	}

	// 	logger.info({ chainId, fromBlock }, "Starting historical sync");

	// 	indexer.lastBlock = fromBlock - 1;

	// 	// Process in batches until caught up
	// 	const currentBlock = await indexer.provider.getBlockNumber();
	// 	let processedBlock = fromBlock;

	// 	while (processedBlock < currentBlock) {
	// 		const toBlock = Math.min(
	// 			processedBlock + config.indexing.batchSize,
	// 			currentBlock
	// 		);

	// 		await this.processEventType(
	// 			indexer,
	// 			"Deposit",
	// 			processedBlock,
	// 			toBlock
	// 		);
	// 		await this.processEventType(
	// 			indexer,
	// 			"Withdraw",
	// 			processedBlock,
	// 			toBlock
	// 		);

	// 		const block = await indexer.provider.getBlock(toBlock);
	// 		if (block) {
	// 			await updateChainSync(chainId, toBlock, block.hash!, 0);
	// 		}

	// 		indexer.lastBlock = toBlock;
	// 		processedBlock = toBlock + 1;

	// 		logger.info(
	// 			{ chainId, fromBlock: processedBlock, toBlock, currentBlock },
	// 			"Historical sync progress"
	// 		);
	// 	}

	// 	logger.info(
	// 		{ chainId, toBlock: currentBlock },
	// 		"Historical sync complete"
	// 	);
	// }
}

// Singleton instance
let indexerInstance: BridgeIndexer | null = null;

export async function initializeIndexer(): Promise<BridgeIndexer> {
	if (!indexerInstance) {
		indexerInstance = new BridgeIndexer();
		await indexerInstance.initialize();
	}
	return indexerInstance;
}

export function getIndexer(): BridgeIndexer {
	if (!indexerInstance) {
		throw new Error("Indexer not initialized");
	}
	return indexerInstance;
}
