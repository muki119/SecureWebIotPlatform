import { hostname } from "os";
import pino from "pino";
import pinoLoki, { type LokiOptions } from "pino-loki";
import { GetEnvString } from "@services/common/utilities";
import { pid } from "process";



const transport = pino.transport({
    target: 'pino-loki',
    options: {
        host: "http://localhost:3100",
        labels: { service: "authentication-service", hostname: hostname() },

    }
})
const logger = pino({
    level: GetEnvString("LOG_LEVEL", "info"),
    base: {
        pid: pid
    }

}, transport)

export default logger;