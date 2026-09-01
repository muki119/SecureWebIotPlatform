/**
 * Redis config - for streams
 */

import { BuildEventBusConfig, CONSUMER_GROUPS } from "@services/common/config";
import { EventBus } from "@services/eventbus";
import { logger } from "./logger";

const EventBusInstance = new EventBus(
	BuildEventBusConfig(CONSUMER_GROUPS.DEVICE_SERVICE),
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
