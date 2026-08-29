import { hostname } from "node:os";
import pino from "pino";
import { GetEnvString } from "../utilities/get_env";

export interface ILoggerOptions {
	host: string;
	serviceName: string;
	labels?: Record<string, string> | undefined; // optional labels other than the default service and hostname
	logLevel: string; // optional log level, defaults to info
}
/**
 * The logger to use in all services
 */
export function CreateLogger(options: ILoggerOptions) {
	const transport = pino.transport({
		target: "pino-loki",
		options: {
			host: options.host,
			labels: {
				service: options.serviceName,
				hostname: hostname(),
				...options.labels,
			},
		},
	});
	const logger = pino(
		{
			level: options.logLevel,
			base: {
				pid: process.pid,
			},
		},
		transport,
	);

	return logger;
}

/**
 * Builds the shared logger for a service, reading the common Loki host and log
 * level from the environment. Use this instead of calling {@link CreateLogger}
 * directly so every service resolves `LOKI_HOST` / `LOG_LEVEL` the same way.
 */
export function CreateServiceLogger(
	serviceName: string,
	labels?: Record<string, string>,
) {
	return CreateLogger({
		host: GetEnvString("LOKI_HOST", "http://localhost:3100"),
		serviceName,
		logLevel: GetEnvString("LOG_LEVEL", "info"),
		labels,
	});
}
