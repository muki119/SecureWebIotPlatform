/**
 * Redis config - for streams
 */

import { hostname } from "node:os";
import { CONSUMER_GROUPS } from "@services/common/config";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import { EventBus } from "@services/eventbus";
import { logger } from "./";

const eventBusConfig = {
	connectionOptions: {
		host: GetEnvString("EVENT_BUS_REDIS_HOST", "localhost"),
		port: GetEnvNumber("EVENT_BUS_REDIS_PORT", 6379),
		password: GetEnvString("EVENT_BUS_REDIS_PASSWORD", ""),
		db: GetEnvNumber("EVENT_BUS_REDIS_DB", 0),
	},
	consumerGroup: CONSUMER_GROUPS.DEVICE_SERVICE,
	consumerName: `${CONSUMER_GROUPS.DEVICE_SERVICE}:${hostname()}`,
	maxCount: 10,
	maxConcurrent: 100,
};

const EventBusInstance = new EventBus(
	eventBusConfig,
	logger,
	"./src/bus/device_control_service_worker",
);

EventBusInstance.handleDebugMessage = (message) => {
	logger.debug({
		message: "Debug message from worker process",
		debugMessage: message,
	});
};
export default EventBusInstance;
