import { ethers } from "ethers";
import { logger } from "./logger.js";
import { isValidAddress, isValidTxHash } from "./utils.js";

export interface DepositEvent {
	token: string;
	sender: string;
	recipient: string;
	amount: bigint;
	nonce: number;
	targetChainId: number;
	txHash: string;
	blockNumber: number;
}

/**
 * Validate deposit event data
 */
export function validateDepositEvent(event: DepositEvent): boolean {
	try {
		// Validate addresses
		if (!isValidAddress(event.token) && event.token !== ethers.ZeroAddress) {
			logger.error({ token: event.token }, "Invalid token address");
			return false;
		}

		if (!isValidAddress(event.sender)) {
			logger.error({ sender: event.sender }, "Invalid sender address");
			return false;
		}

		if (!isValidAddress(event.recipient)) {
			logger.error(
				{ recipient: event.recipient },
				"Invalid recipient address"
			);
			return false;
		}

		// Validate amount
		if (event.amount <= 0n) {
			logger.error({ amount: event.amount.toString() }, "Invalid amount");
			return false;
		}

		// Validate nonce
		if (event.nonce < 0 || !Number.isInteger(event.nonce)) {
			logger.error({ nonce: event.nonce }, "Invalid nonce");
			return false;
		}

		// Validate transaction hash
		if (!isValidTxHash(event.txHash)) {
			logger.error({ txHash: event.txHash }, "Invalid transaction hash");
			return false;
		}

		// Validate block number
		if (event.blockNumber <= 0 || !Number.isInteger(event.blockNumber)) {
			logger.error(
				{ blockNumber: event.blockNumber },
				"Invalid block number"
			);
			return false;
		}

		return true;
	} catch (error) {
		logger.error({ err: error, event }, "Error validating deposit event");
		return false;
	}
}

/**
 * Check if transaction has enough confirmations
 */
export async function hasEnoughConfirmations(
	provider: ethers.Provider,
	blockNumber: number,
	minConfirmations: number
): Promise<boolean> {
	const currentBlock = await provider.getBlockNumber();
	const confirmations = currentBlock - blockNumber;

	logger.debug(
		{ blockNumber, currentBlock, confirmations, required: minConfirmations },
		"Checking confirmations"
	);

	return confirmations >= minConfirmations;
}

/**
 * Validate withdrawal parameters before signing
 */
export function validateWithdrawalParams(params: {
	token: string;
	recipient: string;
	amount: bigint;
	nonce: number;
	sourceChainId: number;
	targetChainId: number;
}): boolean {
	try {
		if (!isValidAddress(params.token) &&params.token !== ethers.ZeroAddress) {
			logger.error({ token: params.token }, "Invalid token address");
			return false;
		}

		if (!isValidAddress(params.recipient)) {
			logger.error({ recipient: params.recipient },"Invalid recipient address");
			return false;
		}

		if (params.amount <= 0n) {
			logger.error({ amount: params.amount.toString() }, "Invalid amount");
			return false;
		}

		if (params.nonce < 0) {
			logger.error({ nonce: params.nonce }, "Invalid nonce");
			return false;
		}

		if (params.sourceChainId === params.targetChainId) {
			logger.error(
				{
					sourceChainId: params.sourceChainId,
					targetChainId: params.targetChainId,
				},
				"Source and target chains cannot be the same"
			);
			return false;
		}

		return true;
	} catch (error) {
		logger.error(
			{ err: error, params },
			"Error validating withdrawal params"
		);
		return false;
	}
}

/**
 * Check if bridge has sufficient balance
 */
export async function checkBridgeBalance(
	provider: ethers.Provider,
	bridgeAddress: string,
	token: string,
	requiredAmount: bigint
): Promise<boolean> {
	try {
		let balance: bigint;

		if (token === ethers.ZeroAddress) {
			// Check native token balance
			balance = await provider.getBalance(bridgeAddress);
		} else {
			// Check ERC20 balance
			const tokenContract = new ethers.Contract(
				token,
				["function balanceOf(address) view returns (uint256)"],
				provider
			);
               // @ts-ignore
			balance = await tokenContract.balanceOf(bridgeAddress);
		}

		const sufficient = balance >= requiredAmount;

		if (!sufficient) {
			logger.warn(
				{
					bridge: bridgeAddress,
					token,
					balance: balance.toString(),
					required: requiredAmount.toString(),
				},
				"Insufficient bridge balance"
			);
		}

		return sufficient;
	} catch (error) {
		logger.error(
			{ err: error, bridgeAddress, token },
			"Error checking bridge balance"
		);
		return false;
	}
}

/**
 * Verify transaction receipt
 */
export async function verifyTransactionReceipt(
	provider: ethers.Provider,
	txHash: string
): Promise<boolean> {
	try {
		const receipt = await provider.getTransactionReceipt(txHash);

		if (!receipt) {
			logger.error({ txHash }, "Transaction receipt not found");
			return false;
		}

		if (receipt.status === 0) {
			logger.error({ txHash }, "Transaction failed");
			return false;
		}

		return true;
	} catch (error) {
		logger.error(
			{ err: error, txHash },
			"Error verifying transaction receipt"
		);
		return false;
	}
}
