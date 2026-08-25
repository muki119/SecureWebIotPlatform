import { BaseWorker } from "@services/eventbus";

class TestWorker extends BaseWorker {
	onCreate() {
		this.handler("TEST_STREAM", async (m) => {
			if (typeof m?.message !== "object" || !m?.message) {
				throw new Error("Message value must be an object");
			}
			this.sendDebugMessage(m); // send message to parent process for debugging - this is the only way debugging is enabled
		});
		this.errorHandler((error) => {
			this.sendDebugMessage({
				message: `Error in worker: ${error.message}`,
			});
		});
	}
}

export const worker = new TestWorker();
worker.start();
