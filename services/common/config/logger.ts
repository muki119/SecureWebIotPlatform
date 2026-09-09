import { hostname } from "node:os";
import pino from "pino";
import { GetEnvString } from "../utilities/get_env";

export interface ILoggerOptions {
	serviceName: string;
	labels?: Record<string, string> | undefined; // extra fields to stamp on every line
	logLevel: string;
}

/**
 * The logger to use in all services. Always writes structured JSON to stdout.
 * When `OTEL_EXPORTER_OTLP_ENDPOINT` is set it also ships records there via
 * `pino-opentelemetry-transport` (a worker thread, independent of the OTel SDK).
 * `@opentelemetry/instrumentation-pino` still stamps each line with trace/span
 * ids; SDK-side log export stays off (`OTEL_LOGS_EXPORTER=none`) so records are
 * not exported twice.
 */
export function CreateLogger(options: ILoggerOptions) {
	const otlpEndpoint = GetEnvString("OTEL_EXPORTER_OTLP_ENDPOINT", "");

	const targets: pino.TransportTargetOptions[] = [
		{
			target: "pino/file",
			level: options.logLevel,
			options: { destination: 1 },
		},
	];

	if (otlpEndpoint) {
		targets.push({
			target: "pino-opentelemetry-transport",
			level: options.logLevel,
			options: {
				resourceAttributes: {
					"service.name": options.serviceName,
					"service.version": GetEnvString(
						"OTEL_SERVICE_VERSION",
						"0.0.0-dev",
					),
				},
			},
		});
	}

	return pino(
		{
			level: options.logLevel,
			base: {
				pid: process.pid,
				service: options.serviceName,
				hostname: hostname(),
				...options.labels,
			},
		},
		pino.transport({ targets }),
	);
}

/**
 * Builds the shared logger for a service, reading the log level from the
 * environment. Use this instead of calling {@link CreateLogger} directly so
 * every service resolves `LOG_LEVEL` the same way.
 */
export function CreateServiceLogger(
	serviceName: string,
	labels?: Record<string, string>,
) {
	return CreateLogger({
		serviceName,
		logLevel: GetEnvString("LOG_LEVEL", "info"),
		labels,
	});
}
