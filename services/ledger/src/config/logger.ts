import { CreateLogger, type ILoggerOptions } from "@services/common/config";
import { GetEnvString } from "@services/common/utilities";

const options: ILoggerOptions = {
	host: GetEnvString("LOKI_HOST", "http://localhost:3100"),
	serviceName: "ledger-service",
	logLevel: GetEnvString("LOG_LEVEL", "info"),
};
export const logger = CreateLogger(options);
