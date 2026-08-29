import type { Logger } from "pino";
import { GetEnvString } from "../utilities/get_env";

export async function ConnectToMongoDB(uri: string, logger: Logger) {
	try {
		const { createConnection } = await import("mongoose");
		const conn = await createConnection(uri).asPromise(); // createConnection instead of connect because connect return a mongoose instance instead of a connection instance  - could need it for the event bus
		logger.info("Connected to Mongo Database successfully.");
		return conn;
	} catch (error) {
		throw new Error("Failed to connect to Mongo database", {
			cause: error,
		});
	}
}

/**
 * Connects to the service's MongoDB instance using the `MONGODB_URI`
 * environment variable.
 */
export async function ConnectToServiceMongoDB(logger: Logger) {
	return ConnectToMongoDB(GetEnvString("MONGODB_URI"), logger);
}
