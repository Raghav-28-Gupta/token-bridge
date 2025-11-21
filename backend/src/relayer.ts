import { ethers } from "ethers";
import { config, getChainConfig, getTargetChainId } from "./config.js";
import { logger, logDeposit, logWithdrawal, logError } from "./logger.js";
import {
	getOrCreateTransaction,
	markTransactionAsRelaying,
	markTransactionAsCompleted,
	markTransactionAsFailed,
	getPendingTransactions,
	getLastProcessedBlock,
} from "./db.js";
import {
	validateDepositEvent,
	hasEnoughConfirmations,
	validateWithdrawalParams,
	checkBridgeBalance,
} from "./validator.js";
import { getSigner } from "./signer.js";
import {
	retry,
	sleep,
	waitForTransaction,
	estimateGasWithBuffer,
	getGasPrice,
	formatAmount,
} from "./utils.js";
import { BridgeABI } from "@bridge/shared";

const BRIDGE_ABI = BridgeABI;


interface ChainState {
	provider: ethers.Provider;
	contract: ethers.Contract;
	lastBlock: number;
}

export class BridgeRelayer {
	private chains: Map<number, ChainState> = new Map();
	private signer = getSigner();
	private isRunning = false;

	async initialize(): Promise<void> {
		logger.info("Initializing bridge relayer...");

		// Initialize all configured chains
		for (const chainId of Object.keys(config.chains).map(Number)) {
			await this.initializeChain(chainId);
		}

		logger.info(
			{ chains: Array.from(this.chains.keys()) },
			"Bridge relayer initialized"
		);
	}

	private async initializeChain(chainId: number): Promise<void> {
		const chainConfig = getChainConfig(chainId);

		logger.info({ chainId, name: chainConfig.name }, "Initializing chain");

		const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
		const contract = new ethers.Contract(
			chainConfig.bridgeAddress,
			BRIDGE_ABI,
			provider
		);

		// Get last processed block from database
		const lastBlock = await getLastProcessedBlock(chainId);

		this.chains.set(chainId, {
			provider,
			contract,
			lastBlock,
		});

		logger.info(
			{ chainId, lastBlock, bridge: chainConfig.bridgeAddress },
			"Chain initialized"
		);
	}

	async start(): Promise<void> {
		if (this.isRunning) {
			logger.warn("Relayer already running");
			return;
		}

		this.isRunning = true;
		logger.info("Starting bridge relayer...");

		// Start monitoring each chain
		const promises = Array.from(this.chains.keys()).map((chainId) =>
			this.monitorChain(chainId)
		);

		await Promise.all(promises);
	}

	async stop(): Promise<void> {
		logger.info("Stopping bridge relayer...");
		this.isRunning = false;
	}

	private async monitorChain(chainId: number): Promise<void> {
		const chainConfig = getChainConfig(chainId);
		logger.info(
			{ chainId, name: chainConfig.name },
			"Starting chain monitor"
		);

		while (this.isRunning) {
			try {
				await this.processChainEvents(chainId);
				await sleep(config.polling.interval);
			} catch (error) {
				logError(error as Error, { chainId, chain: chainConfig.name });
				await sleep(config.polling.interval * 2); // Wait longer on error
			}
		}
	}

	private async processChainEvents(sourceChainId: number): Promise<void> {
		const state = this.chains.get(sourceChainId);
		if (!state) return;

		const currentBlock = await state.provider.getBlockNumber();
		const fromBlock = state.lastBlock + 1;
		const toBlock = Math.min(fromBlock + 1000, currentBlock); // Process in chunks

		if (fromBlock > toBlock) {
			return; // No new blocks
		}

		logger.debug(
			{ sourceChainId, fromBlock, toBlock, currentBlock },
			"Querying deposit events"
		);

		// Query deposit events
		if (!state.contract) {
            logger.warn({ sourceChainId }, "No contract instance for this chain, skipping");
            return;
          }

          const depositFilter = state.contract.filters?.Deposit?.();
          if (!depositFilter) {
               logger.warn(
                    { sourceChainId },
                    "Contract does not expose a Deposit filter (check ABI / event name), skipping"
               );
               return;
          }

		const events = await state.contract.queryFilter(
			depositFilter,
			fromBlock,
			toBlock
		);

		logger.info(
			{ sourceChainId, events: events.length, fromBlock, toBlock },
			`Found ${events.length} deposit events`
		);

		// Process each event
		for (const event of events as ethers.EventLog[]) {
			await this.processDepositEvent(sourceChainId, event);
		}

		// Update last processed block
		state.lastBlock = toBlock;
	}

	private async processDepositEvent(
		sourceChainId: number,
		event: ethers.EventLog
	): Promise<void> {
		try {
			const [token, sender, recipient, amount, nonce, targetChainId] = event.args!;

			const depositEvent = {
				token,
				sender,
				recipient,
				amount: BigInt(amount),
				nonce: Number(nonce),
				targetChainId: Number(targetChainId),
				txHash: event.transactionHash,
				blockNumber: event.blockNumber,
			};

			// Validate event data
			if (!validateDepositEvent(depositEvent)) {
				logger.error({ event: depositEvent }, "Invalid deposit event");
				return;
			}

			logDeposit({
				txHash: depositEvent.txHash,
				token: depositEvent.token,
				sender: depositEvent.sender,
				recipient: depositEvent.recipient,
				amount: formatAmount(depositEvent.amount),
				nonce: depositEvent.nonce,
				sourceChain: sourceChainId,
				targetChain: depositEvent.targetChainId,
			});

			// Check confirmations
			const hasConfirmations = await hasEnoughConfirmations(
				this.chains.get(sourceChainId)!.provider,
				depositEvent.blockNumber,
				config.polling.minConfirmations
			);

			if (!hasConfirmations) {
				logger.info(
					{
						txHash: depositEvent.txHash,
						blockNumber: depositEvent.blockNumber,
					},
					"Waiting for more confirmations"
				);
				return;
			}

			// Save to database
			await getOrCreateTransaction({
				txHash: depositEvent.txHash,
				sourceChain: sourceChainId,
				targetChain: depositEvent.targetChainId,
				token: depositEvent.token,
				sender: depositEvent.sender,
				recipient: depositEvent.recipient,
				amount: depositEvent.amount.toString(),
				nonce: depositEvent.nonce,
				blockNumber: depositEvent.blockNumber,
			});

			// Process withdrawal on target chain
			await this.processWithdrawal(sourceChainId, depositEvent);
		} catch (error) {
			logError(error as Error, {
				sourceChainId,
				txHash: event.transactionHash,
			});
		}
	}

	private async processWithdrawal(
		sourceChainId: number,
		depositEvent: any
	): Promise<void> {
		const targetChainId = depositEvent.targetChainId;
		const targetState = this.chains.get(targetChainId);

		if (!targetState) {
			logger.error({ targetChainId }, "Target chain not configured");
			return;
		}

		try {
			// Mark as relaying
			await markTransactionAsRelaying(depositEvent.txHash);

			// Validate withdrawal params
			if (
				!validateWithdrawalParams({
					token: depositEvent.token,
					recipient: depositEvent.recipient,
					amount: depositEvent.amount,
					nonce: depositEvent.nonce,
					sourceChainId,
					targetChainId,
				})
			) {
				throw new Error("Invalid withdrawal parameters");
			}

			// Check if already processed
			const messageHash = ethers.solidityPackedKeccak256(
				["address", "address", "uint256", "uint256", "uint256", "uint256"],
				[
					depositEvent.token,
					depositEvent.recipient,
					depositEvent.amount,
					depositEvent.nonce,
					sourceChainId,
					targetChainId,
				]
			);

			if (!targetState.contract || typeof targetState.contract.isProcessed !== "function") {
                    logger.error(
                         { targetChainId },
                         "Target chain contract not initialized or missing isProcessed method"
                    );
                    // decide: throw, return, or mark tx as failed — here we throw to surface the misconfiguration
                    throw new Error("Target contract is not available");
               }

               const isProcessed = await targetState.contract.isProcessed(messageHash);

			if (isProcessed) {
				logger.info({ messageHash }, "Withdrawal already processed");
				await markTransactionAsCompleted(depositEvent.txHash, "0x0");
				return;
			}

			// Check bridge balance on target chain
			const hasBalance = await checkBridgeBalance(
				targetState.provider,
				getChainConfig(targetChainId).bridgeAddress,
				depositEvent.token,
				depositEvent.amount
			);

			if (!hasBalance) {
				throw new Error("Insufficient bridge balance on target chain");
			}

			// Sign withdrawal
			const signature = await this.signer.signWithdrawal({
				token: depositEvent.token,
				recipient: depositEvent.recipient,
				amount: depositEvent.amount,
				nonce: depositEvent.nonce,
				sourceChainId,
				targetChainId,
			});

			// Execute withdrawal
			const targetTxHash = await this.executeWithdrawal(
				targetChainId,
				{
					token: depositEvent.token,
					recipient: depositEvent.recipient,
					amount: depositEvent.amount,
					nonce: depositEvent.nonce,
					sourceChainId,
				},
				[signature]
			);

			// Mark as completed
			await markTransactionAsCompleted(depositEvent.txHash, targetTxHash);

			logWithdrawal({
				txHash: targetTxHash,
				token: depositEvent.token,
				recipient: depositEvent.recipient,
				amount: formatAmount(depositEvent.amount),
				nonce: depositEvent.nonce,
				sourceChain: sourceChainId,
				targetChain: targetChainId,
			});
		} catch (error) {
			logError(error as Error, {
				txHash: depositEvent.txHash,
				sourceChainId,
				targetChainId,
			});
			await markTransactionAsFailed(
				depositEvent.txHash,
				(error as Error).message
			);
		}
	}

	private async executeWithdrawal(
		targetChainId: number,
		params: {
			token: string;
			recipient: string;
			amount: bigint;
			nonce: number;
			sourceChainId: number;
		},
		signatures: string[]
	): Promise<string> {
		const state = this.chains.get(targetChainId);
		if (!state) throw new Error("Target chain not initialized");

		const connectedSigner = this.signer.connect(state.provider);
		const contract = new ethers.Contract(
			getChainConfig(targetChainId).bridgeAddress,
			BRIDGE_ABI,
			connectedSigner
		);

		return await retry(async () => {
			// Estimate gas
			const gasLimit = await estimateGasWithBuffer(
				contract,
				"withdraw",
				[
					params.token,
					params.recipient,
					params.amount,
					params.nonce,
					params.sourceChainId,
					signatures,
				],
				config.gas.limitMultiplier
			);

			// Get gas price
			const gasPrice = await getGasPrice(
				state.provider,
				config.gas.maxGasPriceGwei
			);

			logger.info(
				{
					gasLimit: gasLimit.toString(),
					gasPrice: ethers.formatUnits(gasPrice, "gwei"),
					nonce: params.nonce,
				},
				"Executing withdrawal"
			);
               
               // @ts-ignore
			const tx = await contract.withdraw(
				params.token,
				params.recipient,
				params.amount,
				params.nonce,
				params.sourceChainId,
				signatures,
				{ gasLimit, gasPrice }
			);

			logger.info(
				{ txHash: tx.hash, nonce: params.nonce },
				"Withdrawal transaction sent"
			);

			// Wait for confirmation
			await waitForTransaction(
				state.provider,
				tx.hash,
				config.polling.minConfirmations
			);

			return tx.hash;
		});
	}
}

// Singleton instance
let relayerInstance: BridgeRelayer | null = null;

export async function initializeRelayer(): Promise<BridgeRelayer> {
	if (!relayerInstance) {
		relayerInstance = new BridgeRelayer();
		await relayerInstance.initialize();
	}
	return relayerInstance;
}

export function getRelayer(): BridgeRelayer {
	if (!relayerInstance) {
		throw new Error("Relayer not initialized");
	}
	return relayerInstance;
}
