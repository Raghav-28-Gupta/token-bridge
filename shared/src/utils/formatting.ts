import { ethers } from "ethers";


// Formatting utilities for common bridge operations 


// Shorten address for display (0x1234...5678) 
export function shortenAddress(
	address: string,
	startChars: number = 6,
	endChars: number = 4
): string {
	if (address.length <= startChars + endChars + 2) {
		return address;
	}
	return `${address.substring(0, startChars + 2)}...${address.substring(
		address.length - endChars
	)}`;
}


// Shorten transaction hash for display (0xabc...xyz) 
export function shortenTxHash(hash: string, chars: number = 6): string {
	if (hash.length <= chars * 2 + 2) {
		return hash;
	}
	return `${hash.substring(0, chars + 2)}...${hash.substring(66 - chars)}`;
}


// Format large numbers with commas 
export function formatNumber(num: number | bigint | string): string {
	return new Intl.NumberFormat("en-US", {
		useGrouping: true,
	}).format(Number(num));
}


// Format amount with decimals 
export function formatAmount(
	amount: string | bigint,
	decimals: number = 18,
	precision: number = 2
): string {
	if (typeof amount === "string") {
		amount = BigInt(amount);
	}

	const divisor = 10n ** BigInt(decimals);
	const whole = amount / divisor;
	const remainder = amount % divisor;

	const wholeStr = whole.toString();
	const remainderStr = remainder.toString().padStart(decimals, "0");
	const truncated = remainderStr.slice(0, precision);

	if (precision === 0 || truncated === "0".repeat(precision)) {
		return wholeStr;
	}

	return `${wholeStr}.${truncated}`;
}


// Format currency 
export function formatCurrency(
	amount: string | number | bigint,
	symbol: string = "USD",
	decimals: number = 2
): string {
	const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: symbol,
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(num);
	return formatted;
}


// Format percentage 
export function formatPercentage(value: number, decimals: number = 2): string {
	return `${(value * 100).toFixed(decimals)}%`;
}


// Format timestamp as readable date 
export function formatDate(
	timestamp: Date | number | string,
	locale: string = "en-US"
): string {
	const date =
		timestamp instanceof Date
			? timestamp
			: new Date(Number(timestamp) * 1000);
	return date.toLocaleDateString(locale);
}


// Format timestamp as readable time 
export function formatTime(
	timestamp: Date | number | string,
	locale: string = "en-US"
): string {
	const date =
		timestamp instanceof Date
			? timestamp
			: new Date(Number(timestamp) * 1000);
	return date.toLocaleTimeString(locale);
}


// Format timestamp as readable datetime 
export function formatDateTime(
	timestamp: Date | number | string,
	locale: string = "en-US"
): string {
	const date =
		timestamp instanceof Date
			? timestamp
			: new Date(Number(timestamp) * 1000);
	return date.toLocaleString(locale);
}


// Format relative time (e.g., "2 hours ago") 
export function formatRelativeTime(date: Date | number): string {
	const now = Date.now();
	const target = date instanceof Date ? date.getTime() : Number(date);
	const diff = now - target;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return `${seconds}s ago`;
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;

	return formatDate(date);
}


// Format duration in milliseconds 
export function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return `${seconds}s`;
	if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
	if (hours < 24) return `${hours}h ${minutes % 60}m`;
	return `${days}d ${hours % 24}h`;
}


// Format bytes 
export function formatBytes(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(2)} ${units[unitIndex]}`;
}


// Format hex string to uppercase with 0x prefix 
export function formatHex(hex: string): string {
	if (!hex.startsWith("0x")) {
		hex = "0x" + hex;
	}
	return hex.toLowerCase();
}


// Get transaction status badge color 
export function getStatusColor(status: string): string {
	switch (status) {
		case "completed":
			return "#10b981"; // green
		case "pending":
			return "#f59e0b"; // amber
		case "relaying":
			return "#3b82f6"; // blue
		case "failed":
			return "#ef4444"; // red
		default:
			return "#6b7280"; // gray
	}
}


// Get status emoji 
export function getStatusEmoji(status: string): string {
	switch (status) {
		case "completed":
			return "✓";
		case "pending":
			return "⏳";
		case "relaying":
			return "⚙️";
		case "failed":
			return "✗";
		default:
			return "?";
	}
}
