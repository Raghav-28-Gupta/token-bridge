import { validateConfig } from "./config.js";
import { logger } from "./logger.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { initializeIndexer } from "./bridge-indexer.js";
import { startAPI } from "./api.js";

async function main() {
	try {
		logger.info("🔍 Starting Bridge Indexer...");

		// Validate configuration
		logger.info("Validating configuration...");
		validateConfig();
		logger.info("✓ Configuration valid");

		// Connect to database
		logger.info("Connecting to database...");
		await connectDatabase();
		logger.info("✓ Database connected");

		// Initialize indexer
		logger.info("Initializing bridge indexer...");
		const indexer = await initializeIndexer();
		logger.info("✓ Indexer initialized");

		// Start API server
		logger.info("Starting API server...");
		await startAPI();
		logger.info("✓ API server started");

		// Start indexing
		logger.info("Starting event indexing...");
		await indexer.start();
		logger.info("✓ Indexer started");

		// Simplified graceful shutdown
		const shutdown = async () => {
			logger.info("Shutting down gracefully...");
			try {
				await indexer.stop();
				await disconnectDatabase();
				logger.info("Shutdown complete");
				process.exit(0);
			} catch (error) {
				logger.error({ err: error }, "Error during shutdown");
				process.exit(1);
			}
		};

		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);

		logger.info("🚀 Bridge indexer is running");
	} catch (error) {
		logger.error({ err: error }, "Failed to start indexer");
		process.exit(1);
	}
}

// Start the application
main().catch((error) => {
	logger.error({ err: error }, "Fatal error");
	process.exit(1);
});

