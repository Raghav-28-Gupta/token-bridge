import { ethers } from "ethers";
import { logger } from "./logger.js";

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<T> {
	let lastError: Error;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			if (i < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, i);
				logger.warn({ attempt: i + 1, maxRetries, delay }, `Retrying after error: ${lastError.message}`); 
				await sleep(delay);
			}
		}
	}

	throw lastError!;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransaction(
	provider: ethers.Provider,
	txHash: string,
	confirmations: number = 1,
	timeout: number = 300000 // 5 minutes
): Promise<ethers.TransactionReceipt> {
	logger.info({ txHash, confirmations }, "Waiting for transaction confirmation");

	const timeoutPromise = sleep(timeout).then(() => {
		throw new Error(`Transaction confirmation timeout: ${txHash}`);
	});

	const confirmationPromise = provider.waitForTransaction(
		txHash,
		confirmations
	);

	const receipt = await Promise.race([confirmationPromise, timeoutPromise]);

	if (!receipt) {
		throw new Error(`Transaction receipt not found: ${txHash}`);
	}

	if (receipt.status === 0) {
		throw new Error(`Transaction failed: ${txHash}`);
	}

	logger.info({ txHash, blockNumber: receipt.blockNumber }, "Transaction confirmed");
	return receipt;
}

/**
 * Estimate gas with buffer
 */
export async function estimateGasWithBuffer(
	contract: ethers.Contract,
	method: string,
	args: any[],
	multiplier: number = 1.2
): Promise<bigint> {
	try {
		const estimated = await contract[method]!.estimateGas(...args);
		const buffered = (estimated * BigInt(Math.floor(multiplier * 100))) / 100n;
		logger.debug(
			{
				method,
				estimated: estimated.toString(),
				buffered: buffered.toString(),
			},
			"Gas estimated"
		);
		return buffered;
	} catch (error) {
		logger.error({ err: error, method }, "Failed to estimate gas");
		throw error;
	}
}

/**
 * Get current gas price with checks
 */
export async function getGasPrice(
	provider: ethers.Provider,
	maxGasPriceGwei: number
): Promise<bigint> {
	const feeData = await provider.getFeeData();
	let gasPrice = feeData.gasPrice || 0n;

	const maxGasPrice = ethers.parseUnits(maxGasPriceGwei.toString(), "gwei");

	if (gasPrice > maxGasPrice) {
		logger.warn(
			{
				current: ethers.formatUnits(gasPrice, "gwei"),
				max: maxGasPriceGwei,
			},
			"Gas price exceeds maximum, using max"
		);
		gasPrice = maxGasPrice;
	}

	return gasPrice;
}

/**
 * Format transaction for logging
 */
export function formatTransaction(tx: any): Record<string, any> {
	return {
		hash: tx.hash,
		from: tx.from,
		to: tx.to,
		value: tx.value?.toString(),
		gasLimit: tx.gasLimit?.toString(),
		gasPrice: tx.gasPrice?.toString(),
		nonce: tx.nonce,
	};
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
	const retryableMessages = [
		"timeout",
		"network",
		"connection",
		"ETIMEDOUT",
		"ECONNRESET",
		"ENOTFOUND",
		"nonce too low",
		"replacement fee too low",
	];

	return retryableMessages.some((msg) =>
		error.message.toLowerCase().includes(msg.toLowerCase())
	);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
	return ethers.isAddress(address);
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Create message hash for withdrawal
 */
export function encodeWithdrawMessage(
	token: string,
	recipient: string,
	amount: bigint,
	nonce: number,
	sourceChainId: number,
	targetChainId: number
): string {
	return ethers.solidityPackedKeccak256(
		["address", "address", "uint256", "uint256", "uint256", "uint256"],
		[token, recipient, amount, nonce, sourceChainId, targetChainId]
	);
}

/**
 * Format amount for display
 */
export function formatAmount(amount: bigint, decimals: number = 18): string {
	return ethers.formatUnits(amount, decimals);
}

/**
 * Parse amount from string
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
	return ethers.parseUnits(amount, decimals);
}
