// Bridge-related type definitions shared across all services
export interface Chain {
	id: number;
	name: string;
	rpcUrl: string;
	blockExplorerUrl: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
}

export interface Token {
	address: string;
	chainId: number;
	symbol: string;
	name: string;
	decimals: number;
	logoUrl?: string;
}

export interface BridgeConfig {
	chainId: number;
	bridgeAddress: string;
	nativeToken: string;
	supportedTokens: Token[];
}

// Transaction Types
export interface DepositTransaction {
	hash: string;
	from: string;
	to: string;
	token: string;
	amount: string;
	recipient: string;
	sourceChainId: number;
	targetChainId: number;
	nonce: number;
	blockNumber: number;
	timestamp: Date;
	status: "pending" | "confirmed" | "failed";
}

export interface WithdrawTransaction {
	hash: string;
	token: string;
	recipient: string;
	amount: string;
	nonce: number;
	sourceChainId: number;
	targetChainId: number;
	blockNumber: number;
	timestamp: Date;
	status: "pending" | "confirmed" | "failed";
	signatures: string[];
}

export interface BridgeTransfer {
	id: string;
	depositTxHash: string;
	withdrawTxHash?: string;
	token: string;
	sender: string;
	recipient: string;
	amount: string;
	sourceChainId: number;
	targetChainId: number;
	nonce: number;
	status: "pending" | "relaying" | "completed" | "failed";
	depositBlockNumber: number;
	withdrawBlockNumber?: number;
	depositTime: Date;
	withdrawTime?: Date;
	error?: string;
}

// Event Types
export interface DepositEvent {
	txHash: string;
	logIndex: number;
	token: string;
	sender: string;
	recipient: string;
	amount: string;
	nonce: number;
	chainId: number;
	targetChainId: number;
	blockNumber: number;
	blockHash: string;
	timestamp: Date;
}

export interface WithdrawEvent {
	txHash: string;
	logIndex: number;
	token: string;
	recipient: string;
	amount: string;
	nonce: number;
	sourceChainId: number;
	chainId: number;
	blockNumber: number;
	blockHash: string;
	timestamp: Date;
}

export type BridgeEvent = DepositEvent | WithdrawEvent;

// Statistics Types
export interface VolumeStats {
	totalTransfers: number;
	totalVolume: string;
	volumeByChain: Record<number, ChainVolumeStats>;
	volumeByToken: Record<string, TokenVolumeStats>;
}

export interface ChainVolumeStats {
	chainId: number;
	chainName: string;
	deposits: number;
	withdraws: number;
	totalVolume: string;
}

export interface TokenVolumeStats {
	token: string;
	symbol: string;
	decimals: number;
	count: number;
	volume: string;
}

export interface DailyStats {
	date: Date;
	transfers: number;
	volume: string;
	uniqueUsers: number;
	avgTransferAmount: string;
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: Date;
}

export interface PaginatedResponse<T> {
	success: boolean;
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	hasNextPage: boolean;
	timestamp: Date;
}

// Validator Types
export interface ValidatorInfo {
	address: string;
	isActive: boolean;
	lastSeen: Date;
	signatureCount: number;
}

export interface SignatureData {
	validator: string;
	signature: string;
	messageHash: string;
	timestamp: Date;
}

// Error Types
export class BridgeError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode: number = 500
	) {
		super(message);
		this.name = "BridgeError";
	}
}

export interface ErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: Record<string, any>;
	timestamp: Date;
}
