// Simple console-based logger for testing

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

const currentLevel: LogLevel =
	(process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, data?: any): string {
	const timestamp = new Date().toISOString();
	const dataStr = data ? ` ${JSON.stringify(data)}` : "";
	return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
}

export const logger = {
	debug(message: string | object, data?: any) {
		if (!shouldLog("debug")) return;
		if (typeof message === "object") {
			console.debug(formatMessage("debug", "", message));
		} else {
			console.debug(formatMessage("debug", message, data));
		}
	},

	info(message: string | object, data?: any) {
		if (!shouldLog("info")) return;
		if (typeof message === "object") {
			console.info(formatMessage("info", "", message));
		} else {
			console.info(formatMessage("info", message, data));
		}
	},

	warn(message: string | object, data?: any) {
		if (!shouldLog("warn")) return;
		if (typeof message === "object") {
			console.warn(formatMessage("warn", "", message));
		} else {
			console.warn(formatMessage("warn", message, data));
		}
	},

	error(message: string | object, data?: any) {
		if (!shouldLog("error")) return;
		if (typeof message === "object") {
			console.error(formatMessage("error", "", message));
		} else {
			console.error(formatMessage("error", message, data));
		}
	},
};

// Helper functions for structured logging
export function logDeposit(data: {
	txHash: string;
	token: string;
	sender: string;
	recipient: string;
	amount: string;
	nonce: number;
	sourceChain: number;
	targetChain: number;
}) {
	logger.info(
		`Deposit detected: ${data.amount} from ${data.sender} -> ${data.recipient}`,
		{
			type: "deposit",
			...data,
		}
	);
}

export function logWithdrawal(data: {
	txHash: string;
	token: string;
	recipient: string;
	amount: string;
	nonce: number;
	sourceChain: number;
	targetChain: number;
}) {
	logger.info(`Withdrawal processed: ${data.amount} to ${data.recipient}`, {
		type: "withdrawal",
		...data,
	});
}

export function logError(error: Error, context?: Record<string, any>) {
	logger.error(error.message, {
		error: error.name,
		stack: error.stack,
		...context,
	});
}
