import { ethers } from 'ethers';
import { logger } from './logger.js';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
        logger.warn(
          { attempt: i + 1, maxRetries, delay },
          `Retrying after error: ${lastError.message}`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

export async function getBlockTimestamp(
  provider: ethers.Provider,
  blockNumber: number
): Promise<Date> {
  const block = await provider.getBlock(blockNumber);
  if (!block) {
    throw new Error(`Block ${blockNumber} not found`);
  }
  return new Date(block.timestamp * 1000);
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function formatAmount(amount: string | bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export function parseAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

export function shortenTxHash(hash: string, chars: number = 6): string {
  return `${hash.substring(0, chars + 2)}...${hash.substring(66 - chars)}`;
}