import { ethers } from "ethers";


// Validation utilities for common bridge operations 


// Validate Ethereum address 
export function isValidAddress(address: string): boolean {
	return ethers.isAddress(address);
}


// Validate transaction hash 
export function isValidTxHash(hash: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(hash);
}


// Validate message hash 
export function isValidMessageHash(hash: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(hash);
}


// Validate signature 
export function isValidSignature(signature: string): boolean {
	return /^0x[a-fA-F0-9]{130}$/.test(signature);
}


// Normalize address to checksum format 
export function normalizeAddress(address: string): string {
	return ethers.getAddress(address);
}


// Compare addresses (case-insensitive) 
export function compareAddresses(addr1: string, addr2: string): boolean {
	return addr1.toLowerCase() === addr2.toLowerCase();
}


// Validate amount is positive 
export function isPositiveAmount(amount: string | bigint): boolean {
	try {
		const num = typeof amount === "string" ? BigInt(amount) : amount;
		return num > 0n;
	} catch {
		return false;
	}
}


// Validate nonce is non-negative integer 
export function isValidNonce(nonce: number): boolean {
	return Number.isInteger(nonce) && nonce >= 0;
}


// Validate chain ID 
export function isValidChainId(chainId: number): boolean {
	return Number.isInteger(chainId) && chainId > 0;
}


// Validate bridge transfer parameters 
export function validateTransferParams(params: {
	token: string;
	recipient: string;
	amount: string | bigint;
	nonce: number;
	sourceChainId: number;
	targetChainId: number;
}): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!isValidAddress(params.token)) {
		errors.push("Invalid token address");
	}

	if (!isValidAddress(params.recipient)) {
		errors.push("Invalid recipient address");
	}

	if (!isPositiveAmount(params.amount)) {
		errors.push("Amount must be positive");
	}

	if (!isValidNonce(params.nonce)) {
		errors.push("Nonce must be non-negative integer");
	}

	if (!isValidChainId(params.sourceChainId)) {
		errors.push("Invalid source chain ID");
	}

	if (!isValidChainId(params.targetChainId)) {
		errors.push("Invalid target chain ID");
	}

	if (params.sourceChainId === params.targetChainId) {
		errors.push("Source and target chains cannot be the same");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}


// Validate deposit event parameters 
export function validateDepositParams(params: {
	token: string;
	sender: string;
	recipient: string;
	amount: string | bigint;
	nonce: number;
	sourceChainId: number;
	targetChainId: number;
}): { valid: boolean; errors: string[] } {
	const baseValidation = validateTransferParams({
		token: params.token,
		recipient: params.recipient,
		amount: params.amount,
		nonce: params.nonce,
		sourceChainId: params.sourceChainId,
		targetChainId: params.targetChainId,
	});

	const errors = [...baseValidation.errors];

	if (!isValidAddress(params.sender)) {
		errors.push("Invalid sender address");
	}

	if (compareAddresses(params.sender, params.recipient)) {
		errors.push("Sender and recipient cannot be the same");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}


// Validate withdrawal event parameters 
export function validateWithdrawParams(params: {
	token: string;
	recipient: string;
	amount: string | bigint;
	nonce: number;
	sourceChainId: number;
	targetChainId: number;
	signatures: string[];
}): { valid: boolean; errors: string[] } {
	const baseValidation = validateTransferParams({
		token: params.token,
		recipient: params.recipient,
		amount: params.amount,
		nonce: params.nonce,
		sourceChainId: params.sourceChainId,
		targetChainId: params.targetChainId,
	});

	const errors = [...baseValidation.errors];

	if (!Array.isArray(params.signatures) || params.signatures.length === 0) {
		errors.push("At least one signature is required");
	} else {
		for (let i = 0; i < params.signatures.length; i++) {
			if (!isValidSignature(params.signatures[i]!)) {
				errors.push(`Invalid signature at index ${i}`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}


// Validate date is not in the future 
export function isValidDate(date: Date): boolean {
	return date <= new Date();
}


// Validate block number 
export function isValidBlockNumber(blockNumber: number): boolean {
	return Number.isInteger(blockNumber) && blockNumber >= 0;
}
