// Simplified console-based logger for testing
type LogLevel = "info" | "error" | "warn" | "debug";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const LEVELS: Record<LogLevel, number> = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
};

function shouldLog(level: LogLevel): boolean {
	return LEVELS[level] <= LEVELS[LOG_LEVEL as LogLevel];
}

function formatMessage(level: LogLevel, message: string, data?: any): string {
	const timestamp = new Date().toISOString();
	const dataStr = data ? ` ${JSON.stringify(data)}` : "";
	return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
}

export const logger = {
	info: (message: string | any, msg?: string) => {
		if (!shouldLog("info")) return;
		if (typeof message === "string") {
			console.log(formatMessage("info", message));
		} else {
			console.log(formatMessage("info", msg || "Info", message));
		}
	},
	error: (message: string | any, msg?: string) => {
		if (!shouldLog("error")) return;
		if (typeof message === "string") {
			console.error(formatMessage("error", message));
		} else {
			console.error(formatMessage("error", msg || "Error", message));
		}
	},
	warn: (message: string | any, msg?: string) => {
		if (!shouldLog("warn")) return;
		if (typeof message === "string") {
			console.warn(formatMessage("warn", message));
		} else {
			console.warn(formatMessage("warn", msg || "Warning", message));
		}
	},
	debug: (message: string | any, msg?: string) => {
		if (!shouldLog("debug")) return;
		if (typeof message === "string") {
			console.debug(formatMessage("debug", message));
		} else {
			console.debug(formatMessage("debug", msg || "Debug", message));
		}
	},
};

export function logEvent(
	type: "Deposit" | "Withdraw",
	data: {
		txHash: string;
		chainId: number;
		blockNumber: number;
		token: string;
		amount: string;
	}
) {
	logger.info({ eventType: type, ...data }, `${type} event indexed`);
}
