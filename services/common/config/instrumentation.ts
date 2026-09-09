import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";

const sdkDisabled = GetEnvString("OTEL_SDK_DISABLED", "") === "true";

if (!sdkDisabled) {
	const serviceName = GetEnvString("OTEL_SERVICE_NAME", "unknown-service");
	const serviceVersion = GetEnvString("OTEL_SERVICE_VERSION", "0.0.0-dev");
	const prometheusPort = GetEnvNumber("OTEL_PROMETHEUS_PORT", 9464);
	const otlpEndpoint = GetEnvString("OTEL_EXPORTER_OTLP_ENDPOINT", "");

	// Metrics are always served for Prometheus to scrape, on their own port
	// (http://<host>:<prometheusPort>/metrics) so they never sit on the public
	// application port. NodeSDK's own env-driven metric exporter is left off.
	process.env.OTEL_METRICS_EXPORTER = "none";

	// Traces/logs are only shipped when a collector endpoint is configured.
	// Without one, turn the exporters off so the SDK does not retry a dead
	// localhost:4318.
process.env.OTEL_LOGS_EXPORTER = "none";
	if (!otlpEndpoint) {
		process.env.OTEL_TRACES_EXPORTER ??= "none";
	}

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: serviceName,
			[ATTR_SERVICE_VERSION]: serviceVersion,
		}),
		metricReaders: [
			new PrometheusExporter({ port: prometheusPort, host: "0.0.0.0" }),
		],
		instrumentations: [
			getNodeAutoInstrumentations({
				// redis backs sessions, the socket.io adapter and the event bus;
				// auto-spans here are mostly per-request noise.
				"@opentelemetry/instrumentation-redis": { enabled: false },
				// -mongodb already covers the underlying queries.
				"@opentelemetry/instrumentation-mongoose": { enabled: false },
				// dns + tcp spans fire on every outbound connection and just
				// clutter the trace waterfall.
				"@opentelemetry/instrumentation-dns": { enabled: false },
				"@opentelemetry/instrumentation-net": { enabled: false },
			}),
		],
	});

	sdk.start();

	const shutdown = () => {
		sdk.shutdown().finally(() => process.exit(0));
	};
	process.once("SIGTERM", shutdown);
	process.once("SIGINT", shutdown);
}
