import { validateConfig } from "./config.js";
import { logger } from "./logger.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { initializeSigner } from "./signer.js";
import { initializeRelayer } from "./relayer.js";

async function main() {
	try {
		logger.info("🌉 Starting Token Bridge Relayer...");

		// Validate configuration
		logger.info("Validating configuration...");
		validateConfig();
		logger.info("✓ Configuration valid");

		// Connect to database
		logger.info("Connecting to database...");
		await connectDatabase();
		logger.info("✓ Database connected");

		// Initialize signer
		logger.info("Initializing validator signer...");
		const signer = initializeSigner();
		logger.info({ address: signer.getAddress() }, "✓ Signer initialized");

		// Initialize relayer
		logger.info("Initializing bridge relayer...");
		const relayer = await initializeRelayer();
		logger.info("✓ Relayer initialized");

		// Start relayer
		logger.info("Starting relayer service...");
		await relayer.start();
		logger.info("✓ Relayer started successfully");

		// Handle graceful shutdown
		process.on("SIGINT", async () => {
			logger.info("Received SIGINT, shutting down gracefully...");
			await shutdown(relayer);
		});

		process.on("SIGTERM", async () => {
			logger.info("Received SIGTERM, shutting down gracefully...");
			await shutdown(relayer);
		});

		// Handle uncaught errors
		process.on("uncaughtException", (error) => {
			logger.error({ err: error }, "Uncaught exception");
			process.exit(1);
		});

		process.on("unhandledRejection", (reason, promise) => {
			logger.error({ reason, promise }, "Unhandled rejection");
			process.exit(1);
		});

		logger.info("🚀 Bridge relayer is running");
	} catch (error) {
		logger.error({ err: error }, "Failed to start relayer");
		process.exit(1);
	}
}

async function shutdown(relayer: any) {
	try {
		await relayer.stop();
		await disconnectDatabase();
		logger.info("Shutdown complete");
		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, "Error during shutdown");
		process.exit(1);
	}
}

// Start the application
main().catch((error) => {
	logger.error({ err: error }, "Fatal error");
	process.exit(1);
});
