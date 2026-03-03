import type { EventBusConfig, EventMessage } from "@services/eventbus"
import { EventBus } from "@services/eventbus"
import { GetEnvString, GetEnvNumber } from "@services/common/utilities"
import { describe, test, expect, afterAll, assert } from "vitest"
import { randomBytes } from "node:crypto"



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
}

const EventBusInstance = new EventBus(eventBusConfig, console, "./test/test_worker.ts")
await EventBusInstance.init()
var testMessage: any = null
EventBusInstance.handleDebugMessage = (message: any) => {

    testMessage = message.message
}
await EventBusInstance.start()






describe("EventBusTests", async () => {
    test("Should send and receive message correctly", async () => {

        const randomString = randomBytes(20).toString("hex")

        const testMessage: Omit<EventMessage, "timestamp"> = {
            action: "TEST_STREAM",
            testResult: randomString
        }
        await EventBusInstance.send("TEST_STREAM", testMessage)
        await new Promise((resolve) => setTimeout(resolve, 2000))
        expect(testMessage).toBeDefined()
        assert.strictEqual(testMessage.testResult, randomString, "Received message does not match sent message")
    })
})


afterAll(async () => {
    await EventBusInstance.stop()
    console.log("EventBus stopped")
})