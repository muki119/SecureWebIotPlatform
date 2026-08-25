import type { Logger } from "pino";

export interface RedisConfig {
	host: string;
	port: number;
	password: string;
	db: number;
	maxRetries?: number;
}

export async function ConnectToRedis(config: RedisConfig, logger: Logger) {
	try {
		const { createClientPool } = await import("redis");
		const client = createClientPool({
			socket: {
				host: config.host,
				port: config.port,
				reconnectStrategy(retries, cause) {
					if (config.maxRetries && retries >= config.maxRetries) {
						logger.error(
							{ cause },
							`Max retries reached. Unable to connect to Redis`,
						);
						return new Error("Max retries reached");
					}
					const delay = Math.min(100 * 2 ** retries, 3000);
					logger.warn(
						{ cause },
						`Redis connection lost. Retrying in ${delay}ms. Cause: ${cause}`,
					);
					return delay;
				},
			},
			password: config.password,
			database: config.db,
		});
		client.on("error", (err) => logger.error("Redis Client Error", err));
		client
			.connect()
			.then(() => {
				logger.info("Connected to Redis successfully.");
			})
			.catch((error) => {
				throw new Error(
					`Error While attempting to connect to Redis: ${error}`,
				);
			});
		return client;
	} catch (error) {
		throw new Error(`Unable to connect to Redis: ${error}`);
	}
}
