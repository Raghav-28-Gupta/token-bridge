import dotenv from "dotenv";

dotenv.config();

export interface ChainConfig {
	chainId: number;
	rpcUrl: string;
	bridgeAddress: string;
	startBlock: number;
	name: string;
}

export interface Config {
	database: {
		url: string;
	};
	api: {
		port: number;
		host: string;
		corsOrigin: string;
	};
	chains: {
		[chainId: number]: ChainConfig;
	};
	indexing: {
		pollInterval: number;
		batchSize: number;
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

function getEnv(key: string, defaultValue: string): string {
	return process.env[key] || defaultValue;
}

export const config: Config = {
	database: {
		url: requireEnv("DATABASE_URL"),
	},
	api: {
		port: parseInt(getEnv("PORT", "3000")),
		host: getEnv("HOST", "0.0.0.0"),
		corsOrigin: getEnv("CORS_ORIGIN", "*"),
	},
	chains: {
		[parseInt(requireEnv("ETHEREUM_CHAIN_ID"))]: {
			chainId: parseInt(requireEnv("ETHEREUM_CHAIN_ID")),
			rpcUrl: requireEnv("ETHEREUM_RPC_URL"),
			bridgeAddress: requireEnv("ETHEREUM_BRIDGE_ADDRESS"),
			startBlock: parseInt(getEnv("START_BLOCK_ETHEREUM", "0")),
			name: "Ethereum",
		},
		[parseInt(requireEnv("POLYGON_CHAIN_ID"))]: {
			chainId: parseInt(requireEnv("POLYGON_CHAIN_ID")),
			rpcUrl: requireEnv("POLYGON_RPC_URL"),
			bridgeAddress: requireEnv("POLYGON_BRIDGE_ADDRESS"),
			startBlock: parseInt(getEnv("START_BLOCK_POLYGON", "0")),
			name: "Polygon",
		},
	},
	indexing: {
		pollInterval: parseInt(getEnv("POLL_INTERVAL", "12000")),
		batchSize: parseInt(getEnv("BATCH_SIZE", "1000")),
	},
	logging: {
		level: getEnv("LOG_LEVEL", "info"),
	},
};

export function validateConfig(): void {
	const chainIds = Object.keys(config.chains).map(Number);

	// Simplified: Allow single chain for easier testing
	if (chainIds.length === 0) {
		throw new Error("At least 1 chain must be configured");
	}

	for (const chainId of chainIds) {
		const chain = config.chains[chainId];
		// @ts-ignore
		if (!chain.bridgeAddress.startsWith("0x")) {
			throw new Error(`Invalid bridge address for chain ${chainId}`);
		}
	}

	if (config.api.port < 1 || config.api.port > 65535) {
		throw new Error("Invalid port number");
	}
}

export function getChainConfig(chainId: number): ChainConfig {
	const chain = config.chains[chainId];
	if (!chain) {
		throw new Error(`Chain ${chainId} not configured`);
	}
	return chain;
}

export function getAllChainIds(): number[] {
	return Object.keys(config.chains).map(Number);
}
