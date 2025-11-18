import dotenv from "dotenv";
import { parseEther } from "ethers";

dotenv.config();

export interface ChainConfig {
	chainId: number;
	rpcUrl: string;
	bridgeAddress: string;
	name: string;
}

export interface Config {
	database: {
		url: string;
	};
	validator: {
		privateKey: string;
	};
	chains: {
		[chainId: number]: ChainConfig;
	};
	polling: {
		interval: number;
		minConfirmations: number;
	};
	gas: {
		maxGasPriceGwei: number;
		limitMultiplier: number;
	};
	logging: {
		level: string;
	};
}

function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}

export const config: Config = {
	database: {
		url: requireEnv("DATABASE_URL"),
	},
	validator: {
		privateKey: requireEnv("VALIDATOR_PRIVATE_KEY"),
	},
	chains: {
		[parseInt(requireEnv("ETHEREUM_CHAIN_ID"))]: {
			chainId: parseInt(requireEnv("ETHEREUM_CHAIN_ID")),
			rpcUrl: requireEnv("ETHEREUM_RPC_URL"),
			bridgeAddress: requireEnv("ETHEREUM_BRIDGE_ADDRESS"),
			name: "Ethereum",
		},
		[parseInt(requireEnv("POLYGON_CHAIN_ID"))]: {
			chainId: parseInt(requireEnv("POLYGON_CHAIN_ID")),
			rpcUrl: requireEnv("POLYGON_RPC_URL"),
			bridgeAddress: requireEnv("POLYGON_BRIDGE_ADDRESS"),
			name: "Polygon",
		},
	},
	polling: {
		interval: parseInt(process.env.POLL_INTERVAL || "12000"),
		minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || "12"),
	},
	gas: {
		maxGasPriceGwei: parseInt(process.env.MAX_GAS_PRICE_GWEI || "100"),
		limitMultiplier: parseFloat(process.env.GAS_LIMIT_MULTIPLIER || "1.2"),
	},
	logging: {
		level: process.env.LOG_LEVEL || "info",
	},
};

// Validate configuration
export function validateConfig(): void {
	if (!config.validator.privateKey.startsWith("0x")) {
		throw new Error("VALIDATOR_PRIVATE_KEY must start with 0x");
	}

	const chainIds = Object.keys(config.chains).map(Number);
	if (chainIds.length < 2) {
		throw new Error("At least 2 chains must be configured");
	}

	for (const chainId of chainIds) {
		const chain = config.chains[chainId];
          if (!chain) {
               throw new Error(`Chain ${chainId} not configured`);
          }
		if (!chain.bridgeAddress.startsWith("0x")) {
			throw new Error(`Invalid bridge address for chain ${chainId}`);
		}
	}
}

export function getChainConfig(chainId: number): ChainConfig {
	const chain = config.chains[chainId];
	if (!chain) {
		throw new Error(`Chain ${chainId} not configured`);
	}
	return chain;
}

export function getTargetChainId(sourceChainId: number): number {
	const chainIds = Object.keys(config.chains).map(Number);
	const targetChain = chainIds.find((id) => id !== sourceChainId);

	if (!targetChain) {
		throw new Error(
			`No target chain found for source chain ${sourceChainId}`
		);
	}

	return targetChain;
}
