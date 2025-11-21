import { Chain } from "../types/bridge.ts";



// Supported blockchain chains
export const CHAINS: Record<number, Chain> = {
	1: {
		id: 1,
		name: "Ethereum Mainnet",
		rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/",
		blockExplorerUrl: "https://etherscan.io",
		nativeCurrency: {
			name: "Ether",
			symbol: "ETH",
			decimals: 18,
		},
	},
	137: {
		id: 137,
		name: "Polygon",
		rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2/",
		blockExplorerUrl: "https://polygonscan.com",
		nativeCurrency: {
			name: "Polygon",
			symbol: "MATIC",
			decimals: 18,
		},
	},
	42161: {
		id: 42161,
		name: "Arbitrum One",
		rpcUrl: "https://arb-mainnet.g.alchemy.com/v2/",
		blockExplorerUrl: "https://arbiscan.io",
		nativeCurrency: {
			name: "Ethereum",
			symbol: "ETH",
			decimals: 18,
		},
	},
	10: {
		id: 10,
		name: "Optimism",
		rpcUrl: "https://opt-mainnet.g.alchemy.com/v2/",
		blockExplorerUrl: "https://optimistic.etherscan.io",
		nativeCurrency: {
			name: "Ethereum",
			symbol: "ETH",
			decimals: 18,
		},
	},
	11155111: {
		id: 11155111,
		name: "Sepolia Testnet",
		rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/",
		blockExplorerUrl: "https://sepolia.etherscan.io",
		nativeCurrency: {
			name: "Ether",
			symbol: "ETH",
			decimals: 18,
		},
	},
	80001: {
		id: 80001,
		name: "Polygon Mumbai Testnet",
		rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/",
		blockExplorerUrl: "https://mumbai.polygonscan.com",
		nativeCurrency: {
			name: "Polygon",
			symbol: "MATIC",
			decimals: 18,
		},
	},
	421613: {
		id: 421613,
		name: "Arbitrum Goerli Testnet",
		rpcUrl: "https://arb-goerli.g.alchemy.com/v2/",
		blockExplorerUrl: "https://goerli.arbiscan.io",
		nativeCurrency: {
			name: "Ethereum",
			symbol: "ETH",
			decimals: 18,
		},
	},
	420: {
		id: 420,
		name: "Optimism Goerli Testnet",
		rpcUrl: "https://opt-goerli.g.alchemy.com/v2/",
		blockExplorerUrl: "https://goerli-optimism.etherscan.io",
		nativeCurrency: {
			name: "Ethereum",
			symbol: "ETH",
			decimals: 18,
		},
	},
};


// Get chain by ID
export function getChain(chainId: number): Chain | null {
	return CHAINS[chainId] || null;
}


// Get all supported chain IDs
export function getSupportedChainIds(): number[] {
	return Object.keys(CHAINS).map(Number);
}


// Check if chain is supported
export function isChainSupported(chainId: number): boolean {
	return chainId in CHAINS;
}


// Get chain name
export function getChainName(chainId: number): string {
	const chain = CHAINS[chainId];
	return chain?.name || `Unknown Chain (${chainId})`;
}


// Get block explorer URL
export function getBlockExplorerUrl(
	chainId: number,
	type: "tx" | "address" | "block",
	value: string
): string | null {
	const chain = CHAINS[chainId];
	if (!chain) return null;

	const baseUrl = chain.blockExplorerUrl;
	switch (type) {
		case "tx":
			return `${baseUrl}/tx/${value}`;
		case "address":
			return `${baseUrl}/address/${value}`;
		case "block":
			return `${baseUrl}/block/${value}`;
		default:
			return null;
	}
}


// Get transaction link
export function getTxLink(chainId: number, txHash: string): string | null {
	return getBlockExplorerUrl(chainId, "tx", txHash);
}


// Get address link
export function getAddressLink(
	chainId: number,
	address: string
): string | null {
	return getBlockExplorerUrl(chainId, "address", address);
}
