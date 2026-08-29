import { BuildEventBusConfig, CONSUMER_GROUPS } from "@services/common/config";
import { EventBus } from "@services/eventbus";
import logger from "./logger";

const EventBusInstance = new EventBus(
	BuildEventBusConfig(CONSUMER_GROUPS.DOMAIN_SERVICE),
	logger,
	"./src/bus/domain_service_worker",
);

EventBusInstance.handleDebugMessage = (message) => {
	logger.debug({
		message: "Debug message from worker process",
		debugMessage: message,
	});
};
export default EventBusInstance;
