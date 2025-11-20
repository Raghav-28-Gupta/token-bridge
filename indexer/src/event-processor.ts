import { ethers } from "ethers";
import { logger, logEvent } from "./logger.js";
import {
	createBridgeEvent,
	eventExists,
	createOrUpdateTransfer,
	getTransferByDepositHash,
	updateTransferWithWithdraw,
} from "./db.js";
import { getBlockTimestamp, normalizeAddress, formatAmount } from "./utils.js";

export interface DepositEventData {
	token: string;
	sender: string;
	recipient: string;
	amount: bigint;
	nonce: number;
	targetChainId: number;
}

export interface WithdrawEventData {
	token: string;
	recipient: string;
	amount: bigint;
	nonce: number;
	sourceChainId: number;
}

export class EventProcessor {
	async processDepositEvent(
		event: ethers.EventLog,
		chainId: number,
		provider: ethers.Provider
	): Promise<void> {
		try {
			// Check if already processed
			if (await eventExists(event.transactionHash, event.index)) {
				logger.debug(
					{ txHash: event.transactionHash, logIndex: event.index },
					"Event already indexed"
				);
				return;
			}

			const [token, sender, recipient, amount, nonce, targetChainId] =
				event.args!;

			const eventData: DepositEventData = {
				token: normalizeAddress(token),
				sender: normalizeAddress(sender),
				recipient: normalizeAddress(recipient),
				amount: BigInt(amount),
				nonce: Number(nonce),
				targetChainId: Number(targetChainId),
			};

			const block = await event.getBlock();
			const timestamp = new Date(block.timestamp * 1000);

			// Save event
			await createBridgeEvent({
				txHash: event.transactionHash,
				logIndex: event.index,
				eventType: "Deposit",
				chainId,
				blockNumber: event.blockNumber,
				blockHash: block.hash!,
				timestamp,
				token: eventData.token,
				sender: eventData.sender,
				recipient: eventData.recipient,
				amount: eventData.amount.toString(),
				nonce: eventData.nonce,
				targetChainId: eventData.targetChainId,
			});

			// Create or update transfer
			await createOrUpdateTransfer({
				depositTxHash: event.transactionHash,
				sourceChainId: chainId,
				targetChainId: eventData.targetChainId,
				token: eventData.token,
				sender: eventData.sender,
				recipient: eventData.recipient,
				amount: eventData.amount.toString(),
				nonce: eventData.nonce,
				depositBlock: event.blockNumber,
				depositTime: timestamp,
				status: "pending",
			});

			logEvent("Deposit", {
				txHash: event.transactionHash,
				chainId,
				blockNumber: event.blockNumber,
				token: eventData.token,
				amount: formatAmount(eventData.amount),
			});
		} catch (error) {
			logger.error(
				{ err: error, txHash: event.transactionHash },
				"Failed to process deposit event"
			);
			throw error;
		}
	}

	async processWithdrawEvent(
		event: ethers.EventLog,
		chainId: number,
		provider: ethers.Provider
	): Promise<void> {
		try {
			// Check if already processed
			if (await eventExists(event.transactionHash, event.index)) {
				logger.debug(
					{ txHash: event.transactionHash, logIndex: event.index },
					"Event already indexed"
				);
				return;
			}

			const [token, recipient, amount, nonce, sourceChainId] = event.args!;

			const eventData: WithdrawEventData = {
				token: normalizeAddress(token),
				recipient: normalizeAddress(recipient),
				amount: BigInt(amount),
				nonce: Number(nonce),
				sourceChainId: Number(sourceChainId),
			};

			const block = await event.getBlock();
			const timestamp = new Date(block.timestamp * 1000);

			// Save event
			await createBridgeEvent({
				txHash: event.transactionHash,
				logIndex: event.index,
				eventType: "Withdraw",
				chainId,
				blockNumber: event.blockNumber,
				blockHash: block.hash!,
				timestamp,
				token: eventData.token,
				recipient: eventData.recipient,
				amount: eventData.amount.toString(),
				nonce: eventData.nonce,
				sourceChainId: eventData.sourceChainId,
			});

			// Try to match with deposit and update transfer status
			await this.matchWithdrawWithDeposit(
				eventData,
				event.transactionHash,
				event.blockNumber,
				timestamp
			);

			logEvent("Withdraw", {
				txHash: event.transactionHash,
				chainId,
				blockNumber: event.blockNumber,
				token: eventData.token,
				amount: formatAmount(eventData.amount),
			});
		} catch (error) {
			logger.error(
				{ err: error, txHash: event.transactionHash },
				"Failed to process withdraw event"
			);
			throw error;
		}
	}

	private async matchWithdrawWithDeposit(
		withdrawData: WithdrawEventData,
		withdrawTxHash: string,
		withdrawBlock: number,
		withdrawTime: Date
	): Promise<void> {
		try {
			// Find matching deposit by nonce and source chain
			const transfers = await this.findMatchingDeposit(
				withdrawData.nonce,
				withdrawData.sourceChainId
			);

			if (transfers.length === 0) {
				logger.warn(
					{
						nonce: withdrawData.nonce,
						sourceChainId: withdrawData.sourceChainId,
					},
					"No matching deposit found for withdraw"
				);
				return;
			}

			// Update the transfer with withdraw information
			for (const transfer of transfers) {
				await updateTransferWithWithdraw(
					transfer.depositTxHash,
					withdrawTxHash,
					withdrawBlock,
					withdrawTime
				);

				logger.info(
					{
						depositTx: transfer.depositTxHash,
						withdrawTx: withdrawTxHash,
						nonce: withdrawData.nonce,
					},
					"Transfer completed"
				);
			}
		} catch (error) {
			logger.error(
				{ err: error, nonce: withdrawData.nonce },
				"Failed to match withdraw with deposit"
			);
		}
	}

	private async findMatchingDeposit(nonce: number, sourceChainId: number) {
		// Import here to avoid circular dependency
		const { getTransferByNonce } = await import("./db.js");

		// Try to find transfer by nonce
		const transfer = await getTransferByNonce(nonce, sourceChainId, 0);
		return transfer ? [transfer] : [];
	}

	async processBatch(
		events: ethers.EventLog[],
		chainId: number,
		provider: ethers.Provider,
		eventType: "Deposit" | "Withdraw"
	): Promise<void> {
		logger.info(
			{ chainId, eventCount: events.length, eventType },
			"Processing event batch"
		);

		for (const event of events) {
			try {
				if (eventType === "Deposit") {
					await this.processDepositEvent(event, chainId, provider);
				} else {
					await this.processWithdrawEvent(event, chainId, provider);
				}
			} catch (error) {
				logger.error(
					{
						err: error,
						txHash: event.transactionHash,
						eventType,
					},
					"Failed to process event in batch"
				);
				// Continue processing other events
			}
		}

		logger.info(
			{ chainId, eventCount: events.length, eventType },
			"Batch processing complete"
		);
	}
}
