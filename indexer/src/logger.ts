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
	logger.info(
		{
			eventType: type,
			...data,
		},
		`${type} event indexed`
	);
}
