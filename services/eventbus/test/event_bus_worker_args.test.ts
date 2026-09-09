import type { ChildProcess } from "node:child_process";
import { fork } from "node:child_process";
import type { EventBusConfig } from "@services/eventbus";
import { EventBus } from "@services/eventbus";
import type { Logger } from "pino";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("node:child_process", () => ({
	fork: vi.fn(),
}));

const eventBusConfig: EventBusConfig = {
	connectionOptions: {
		host: "localhost",
		port: 6379,
		password: "",
		db: 0,
	},
	consumerGroup: "test_consumer_group",
	consumerName: "test_consumer",
	maxConcurrent: 1,
	maxCount: 1,
};

describe("EventBus worker process", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("does not inherit OpenTelemetry instrumentation imports", async () => {
		const childProcess = {
			send: vi.fn(),
			on: vi.fn(),
		} as unknown as ChildProcess;
		vi.mocked(fork).mockReturnValue(childProcess);

		const originalExecArgv = process.execArgv;
		process.execArgv = [
			"--import",
			"/project/node_modules/tsx/loader.mjs",
			"--import",
			"/project/instrumentation.ts",
		];

		try {
			const eventBus = new EventBus(
				eventBusConfig,
				console as unknown as Logger,
				"./test/test_worker.ts",
			);
			const sender = Reflect.get(eventBus, "sender");
			vi.spyOn(sender, "init").mockResolvedValue(undefined);

			await eventBus.init();

			expect(fork).toHaveBeenCalledWith(
				expect.any(String),
				[],
				expect.objectContaining({
					execArgv: [
						"--import",
						"/project/node_modules/tsx/loader.mjs",
					],
				}),
			);
		} finally {
			process.execArgv = originalExecArgv;
		}
	});
});
