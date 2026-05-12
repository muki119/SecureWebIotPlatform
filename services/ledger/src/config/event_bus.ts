import { EventBus } from "@services/eventbus";
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";
import { CONSUMER_GROUPS } from "@services/common/config";
import { logger } from "./logger";
import { hostname } from "node:os";
const eventBusConfig = {
    connectionOptions: {
        host: GetEnvString("EVENT_BUS_REDIS_HOST", "localhost"),
        port: GetEnvNumber("EVENT_BUS_REDIS_PORT", 6379),
        password: GetEnvString("EVENT_BUS_REDIS_PASSWORD", ""),
        db: GetEnvNumber("EVENT_BUS_REDIS_DB", 0),
    },
    consumerGroup: CONSUMER_GROUPS.LEDGER_SERVICE,
    consumerName: `${CONSUMER_GROUPS.LEDGER_SERVICE}:${hostname()}`,
    maxCount: 10,
    maxConcurrent: 100,
}

const EventBusInstance = new EventBus(
    eventBusConfig,
    logger,
    "./src/bus/ledger_service_worker.js",
);

EventBusInstance.handleDebugMessage = (message) => {
    logger.debug({ message: "Debug message from worker process", debugMessage: message });
}
export default EventBusInstance;