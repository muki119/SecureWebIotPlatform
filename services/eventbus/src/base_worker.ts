/**
 * This is the child process that will be spawned by the evenbus class
 * This allows the controlling of the listener in a manner that wont block or be a detriment to the main thread which has the main server
 * In the future this will become a whole different microservice / worker that will sidecar services .
 * But this service is also good because it always ensures that there is at least an listener and handler for a service and is compact enough to run on the same machine and low traffic applications
 *
 */

import process from "node:process";
import { EventListener } from "@services/eventbus";
import type {
	EventBusConfig,
	EventBusHandler,
	EventBusErrorHandler,
} from "@services/eventbus";

export const MessageFlags = {
	CREATE: "CREATE",
	START: "START",
	STOP: "STOP",
	STOPPED: "STOPPED",
	PROC_ERROR: "PROC_ERROR", // FOR PROCESS ERRORS
	ERROR: "ERROR", // FOR LISTENER ERRORS
	DEBUG: "DEBUG",
	PING: "PING",
	PONG: "PONG",
};

/**
 * @description This is the base worker frame that every serivce MUST extend to make their own worker and add their own stream handlers
 * Twas hell to make
 */
export abstract class BaseWorker {
	// this is everything that a worker should have - the purpose of this is that each service will make their own class that extends this baseworker and then it will add their specific handlers
	// this all could be fixed if this wasnt in js/ts lol

	protected listenerInstance: EventListener | null = null;

	/**
	 *
	 * @param stream - the stream to register
	 * @param handler - the function to process messages from the specified stream
	 * @returns nothing tbh
	 * @description - registers a handler - is just a wrapper for the listener instance registerHandler func
	 */
	protected handler(stream: string, handler: EventBusHandler) {
		return this.listenerInstance?.registerHandler(stream, handler);
	}

	/**
	 *
	 * @param handler  - the function to handle errors
	 * @returns - nothing tbh
	 * @description - registers an error handler - is just a wrapper for the listener instance registerErrorHandler func
	 */
	protected errorHandler(handler: EventBusErrorHandler) {
		return this.listenerInstance?.registerErrorHandler(handler);
	}

	private async stop() {
		console.log("worker process shutting down");
		if (!this.listenerInstance) {
			process.send!({
				flag: MessageFlags.PROC_ERROR,
				value: "EventListener instance must be created before stopping",
			});
			process.exit(0)
		}
		await this.listenerInstance!.close()
			.then(() => {
				process.send!({ flag: MessageFlags.STOPPED });
				process.exit(0);
			})
			.catch((error) => {
				process.send!({
					flag: MessageFlags.PROC_ERROR,
					value: error.message,
				});
				process.send!({ flag: MessageFlags.STOPPED });
				process.exit(1); // since the intention is to stop the process if there is an error during shutdown  exit with code 1 to show an error
			});
	}

	/**
	 * @description - starts litening for messages from the parent process
	 * the messages allow for management of the listener instance
	 */
	public start() {
		// begins listening for proc messages
		process.title = "EventBus Worker Process";
		process.on("message", async (message: { flag: string; value?: any }) => {
			if (process.send === undefined) {
				throw new Error("Process does not have ipc channel");
			}
			switch (message.flag) {
				case MessageFlags.CREATE:
					if (!message.value) {
						process.send({
							flag: MessageFlags.PROC_ERROR,
							value: "Config must be provided for CREATE flag",
						});
						return;
					}
					if (this.listenerInstance) {
						process.send({
							flag: MessageFlags.PROC_ERROR,
							value: "EventListener instance already exists",
						});
						return;
					}
					const config: EventBusConfig = message.value;
					this.listenerInstance = new EventListener(config);
					await this.onCreate();
					break;
				case MessageFlags.START:
					if (!this.listenerInstance) {
						process.send({
							flag: MessageFlags.PROC_ERROR,
							value: "EventListener instance must be created before starting",
						});
						return;
					}
					this.listenerInstance.listen().catch((error) => {
						process.send!({
							flag: MessageFlags.ERROR,
							value: error.message,
						});
					});
					break;
				case MessageFlags.STOP:
					this.stop();
					break;
				case MessageFlags.PING:
					process.send({ flag: MessageFlags.PONG });
					break;
				default:
					process.send({
						flag: MessageFlags.PROC_ERROR,
						value: "Invalid flag received",
					});
					break;
			}
		});
		process.on("SIGINT", () => {
			this.stop();
		});
		process.on("SIGTERM", () => {
			this.stop();
		});
	}

	/**
	 *
	 * @param value
	 * @description - a hook thats called when the Listener innstance is created but not listening yet , this allows for registering handlers before the listener
	 * this is the only way i could make handlers pass through a process because of the json serialisation and what not
	 * no function pointers no nothing that could make this easier and js has some weird class function shit where it copies functions without context
	 *
	 * i kinda modeled this function after like Class based react components lol
	 */
	protected abstract onCreate(value?: any): Promise<void> | void;

	protected sendDebugMessage(message: { [k: string]: any }): void {
		process.send!({ flag: MessageFlags.DEBUG, value: message });
	}
}
