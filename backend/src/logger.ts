import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
	level: config.logging.level,
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "HH:MM:ss Z",
			ignore: "pid,hostname",
		},
	},
});

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
		{
			type: "deposit",
			...data,
		},
		`Deposit detected: ${data.amount} from ${data.sender} -> ${data.recipient}`
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
	logger.info(
		{
			type: "withdrawal",
			...data,
		},
		`Withdrawal processed: ${data.amount} to ${data.recipient}`
	);
}

export function logError(error: Error, context?: Record<string, any>) {
	logger.error(
		{
			err: error,
			...context,
		},
		error.message
	);
}
