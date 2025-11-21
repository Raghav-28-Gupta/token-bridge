import type { Token } from "../types/bridge.js";


// Common token standards and addresses
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000"; // Special address for native tokens


// Common tokens across chains
export const TOKENS: Record<string, Record<number, Token>> = {
	// USDC
	USDC: {
		1: {
			address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			symbol: "USDC",
			name: "USD Coin",
			decimals: 6,
			chainId: 1,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
		},
		137: {
			address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
			symbol: "USDC",
			name: "USD Coin",
			decimals: 6,
			chainId: 137,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png",
		},
	},
	// USDT
	USDT: {
		1: {
			address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
			symbol: "USDT",
			name: "Tether USD",
			decimals: 6,
			chainId: 1,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
		},
		137: {
			address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
			symbol: "USDT",
			name: "Tether USD",
			decimals: 6,
			chainId: 137,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AeB04B58e8F/logo.png",
		},
	},
	// DAI
	DAI: {
		1: {
			address: "0x6b175474e89094c44da98b954eedeac495271d0f",
			symbol: "DAI",
			name: "Dai Stablecoin",
			decimals: 18,
			chainId: 1,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
		},
		137: {
			address: "0x8f3cf7ad23cd3cadbd9735aff958023d60313f81",
			symbol: "DAI",
			name: "Dai Stablecoin",
			decimals: 18,
			chainId: 137,
			logoUrl:
				"https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0x8f3Cf7ad23cD3CaDbD9735AFF958023D60313f81/logo.png",
		},
	},
};


// Get token by symbol and chain
export function getToken(symbol: string, chainId: number): Token | null {
	const tokens = TOKENS[symbol];
	if (!tokens) return null;
	return tokens[chainId] || null;
}


// Get all tokens for a chain
export function getTokensByChain(chainId: number): Token[] {
	const tokens: Token[] = [];
	for (const tokenGroup of Object.values(TOKENS)) {
		if (tokenGroup[chainId]) {
			tokens.push(tokenGroup[chainId]);
		}
	}
	return tokens;
}


// Format token amount
export function formatTokenAmount(
	amount: string | bigint,
	decimals: number,
	precision: number = 2
): string {
	if (typeof amount === "string") {
		amount = BigInt(amount);
	}

	const divisor = 10n ** BigInt(decimals);
	const wholePart = amount / divisor;
	const fractionalPart = amount % divisor;

	const whole = wholePart.toString();
	const fractional = fractionalPart
		.toString()
		.padStart(decimals, "0")
		.slice(0, precision);

	return `${whole}.${fractional}`;
}


// Parse token amount
export function parseTokenAmount(amount: string, decimals: number): bigint {
	const [whole, fractional = ""] = amount.split(".");
	const fractionalDigits = fractional
		? fractional.padEnd(decimals, "0")
		: "0".repeat(decimals);
	return (
		BigInt(whole || "0") * 10n ** BigInt(decimals) +
		BigInt(fractionalDigits.slice(0, decimals))
	);
}
