import { hostname } from "node:os";
import { CONSUMER_GROUPS } from "@services/common/config";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import { EventSender } from "@services/eventbus";

const eventBusConfig = {
	connectionOptions: {
		host: GetEnvString("EVENT_BUS_REDIS_HOST", "localhost"),
		port: GetEnvNumber("EVENT_BUS_REDIS_PORT", 6379),
		password: GetEnvString("EVENT_BUS_REDIS_PASSWORD", ""),
		db: GetEnvNumber("EVENT_BUS_REDIS_DB", 0),
	},
	consumerGroup: CONSUMER_GROUPS.AUTH_SERVICE,
	consumerName: `${CONSUMER_GROUPS.AUTH_SERVICE}:${hostname()}`,
	maxCount: 10,
	maxConcurrent: 100,
};

const EventSenderInstance = new EventSender(eventBusConfig);
export default EventSenderInstance;
