import { BaseWorker, MessageFlags } from "@services/eventbus"




class TestWorker extends BaseWorker {
    onCreate() {
        this.handler("TEST_STREAM", async (m) => {
            this.sendDebugMessage(m!); // send message to parent process for debugging - this is the only way debugging is enabled 
        })
    }
}


export const worker = new TestWorker();
worker.start();