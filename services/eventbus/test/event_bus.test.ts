import { randomBytes } from "node:crypto";
import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import type {
	EventBusConfig,
	EventMessage,
	EventPayload,
} from "@services/eventbus";
import { EventBus } from "@services/eventbus";
import type { Logger } from "pino";
import { afterAll, assert, describe, expect, test } from "vitest";

const eventBusConfig: EventBusConfig = {
	connectionOptions: {
		host: GetEnvString("TEST_REDIS_HOST", "localhost"),
		port: GetEnvNumber("TEST_REDIS_PORT", 6379),
		password: GetEnvString("TEST_REDIS_PASSWORD", ""), // add password if needed
		db: GetEnvNumber("TEST_REDIS_DB", 0),
	},
	consumerGroup: "test_consumer_group",
	consumerName: "test_consumer",
	maxCount: 10,
	maxConcurrent: 100,
};

const EventBusInstance = new EventBus(
	eventBusConfig,
	console as unknown as Logger,
	"./test/test_worker.ts",
);
await EventBusInstance.init();
var returntestMessage: EventMessage;
EventBusInstance.handleDebugMessage = (message) => {
	if (message === null || message === undefined) {
		throw new Error(
			"Received null or undefined message in handleDebugMessage",
		);
	}
	const payload = (message as EventPayload)?.message as EventMessage;
	returntestMessage = payload;
};
await EventBusInstance.start();

describe("EventBusTests", async () => {
	test("Should send and receive message correctly", async () => {
		const randomString = randomBytes(20).toString("hex");

		const testMessage: Omit<EventMessage, "timestamp"> = {
			action: "TEST_STREAM",
			testResult: randomString,
		};
		await EventBusInstance.send("TEST_STREAM", testMessage);
		await new Promise((resolve) => setTimeout(resolve, 1000)); // give it a second to process , the instant eval wont work - even in localhost
		expect(returntestMessage).toBeDefined();
		assert.strictEqual(
			returntestMessage.testResult,
			randomString,
			"Received message does not match sent message",
		);
	});
});

afterAll(async () => {
	await EventBusInstance.stop();
	console.log("EventBus stopped");
});
