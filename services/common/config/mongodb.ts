import { createConnection } from "mongoose";
import { type Logger } from "pino";
export async function ConnectToMongoDB(uri: string, logger: Logger) {
    try {
        const conn = await createConnection(uri).asPromise() // createConnection instead of connect because connect return a mongoose instance instead of a connection instance  - could need it for the event bus
        logger.info("Connected to Mongo Database successfully.")
        return conn
    } catch (error) {
        throw new Error("Failed to connect to Mongo database", { cause: error })
    }
}