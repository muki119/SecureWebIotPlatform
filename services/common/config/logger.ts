import pino from "pino";
import { hostname } from "os";


export interface ILoggerOptions {
    host: string,
    serviceName: string,
    labels?: Record<string, string> // optional labels other than the default service and hostname
    logLevel: string // optional log level, defaults to info
}
/**
 * The logger to use in all services
 */
export function CreateLogger(options: ILoggerOptions) {
    const transport = pino.transport({
        target: 'pino-loki',
        options: {
            host: options.host,
            labels: { service: options.serviceName, hostname: hostname(), ...options.labels },
        }
    })
    const logger = pino({
        level: options.logLevel,
        base: {
            pid: process.pid
        }

    }, transport)

    return logger
}