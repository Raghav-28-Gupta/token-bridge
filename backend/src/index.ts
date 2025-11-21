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

		// Simplified graceful shutdown
		const shutdown = async () => {
			logger.info("Shutting down gracefully...");
			try {
				await relayer.stop();
				await disconnectDatabase();
				logger.info("Shutdown complete");
				process.exit(0);
			} catch (error) {
				logger.error("Error during shutdown", { err: error });
				process.exit(1);
			}
		};

		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);

		logger.info("🚀 Bridge relayer is running");
	} catch (error) {
		logger.error("Failed to start relayer", { err: error });
		process.exit(1);
	}
}

// Start the application
main().catch((error) => {
	logger.error("Fatal error", { err: error });
	process.exit(1);
});
