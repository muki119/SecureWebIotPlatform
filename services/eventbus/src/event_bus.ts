import {
	type EventBusConfig,
	EventSender,
	type EventMessage,
} from "@services/eventbus";
import { ChildProcess, fork } from "node:child_process";
import { MessageFlags } from "@services/eventbus";
import type { Logger } from "pino"

/**
 * @description the event bus in its abstraction glory
 * this was hell to make
 * i keep forgetting and learning how async works
 * didnt even know that nodes fork ISNT POSIX FORK so i couldnt just split at point of call and had to implement it is some interesting way
 *
 * every service that needs this needs to create its own worker file that extends the base worker so it can implement its own handlers
 *
 * kinda fun to make though (a little bit)
 */
export class EventBus {
	// comprises of the listener proccess and the sender function
	private logger: Logger;
	private config: EventBusConfig; // for potential retries
	private isListening: boolean;
	private listenerProcess: ChildProcess | null = null; // the listener process spawned
	private sender: EventSender;
	private workerFile: string;
	public handleDebugMessage: ((message: any) => void) | null = null; // handler for debug messages from worker process

	constructor(config: EventBusConfig, logger: Logger, workerDir: string) {
		this.config = config;
		this.logger = logger;
		this.isListening = false;
		this.workerFile = workerDir;
		this.sender = new EventSender(this.config);
	}

	/**
	 *
	 * @param stream - the stream to send the message to
	 * @param message - the message to send
	 * @returns a promise of nothing lol
	 */
	async send(stream: string, message: Omit<EventMessage, "timestamp">) {
		if (!stream || !message) {
			throw new Error("Stream and message must be provided", {
				cause: {
					stream,
					message,
				},
			});
		}
		if (!message.action) {
			throw new Error("Message must have an action", {
				cause: {
					message,
				},
			});
		}
		return this.sender.send(stream, {
			...message,
			timestamp: new Date().toISOString(),
		} as EventMessage);
	}

	async init() {
		await this.sender.init();
		this.listenerProcess = fork(this.workerFile, [], { env: process.env });
		if (!this.listenerProcess) {
			throw new Error("Listener process not initialized");
		}
		this.listenerProcess.send({
			flag: MessageFlags.CREATE,
			value: this.config,
		});
		this.listenerProcess.on(
			"message",
			(message: { flag: string; value?: any }) => {
				// find if error
				switch (
				message.flag // this just creates some listner handlers - once this is set up then you dont have to add additional listeners
				) {
					case MessageFlags.PROC_ERROR:
						this.logger.error(
							"Error in listener process: " + message.value,
						);
						break;
					case MessageFlags.ERROR:
						this.logger.error(
							"Error handling message: " + message.value,
						);
						break;
					case MessageFlags.PONG:
						this.logger.info("Received PONG from listener process");
						break;
					case MessageFlags.DEBUG:
						if (this.handleDebugMessage) {
							this.handleDebugMessage(message.value);
						} else {
							this.logger.debug(
								"Received debug message from listener process: " +
								JSON.stringify(message.value),
							);
						}
						break;

					case MessageFlags.STOPPED:
						this.logger.info("Listener process has stopped");
						this.isListening = false;
						break;
					default:
						this.logger.warn(
							"Unknown message flag received from listener process: " +
							message.flag,
						);
				}
			},
		);
		this.listenerProcess.on("exit", (code, signal) => {
			this.logger.info(
				`Listener process exited with code ${code} and signal ${signal}`,
			);
			this.isListening = false;
		});
	}
	async waitForStop() {
		while (this.isListening) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // wait for 100ms before checking again
		}
	}
	/**
	 *
	 * @returns nothing lol
	 * @description - starts a listener process
	 */
	start() {
		if (!this.listenerProcess) {
			throw new Error("Listener process not initialized");
		}
		if (this.isListening) {
			this.logger.warn("Listener process is already running");
			return;
		}
		this.listenerProcess.send({ flag: MessageFlags.START });
		this.isListening = true;
		this.logger.info("Starting listener manager");
	}

	/**
	 *
	 * @returns nothing lol
	 * @description - stops the listener process
	 */
	async stop() {
		if (!this.listenerProcess) {
			throw new Error("Listener process not initialized");
		}
		if (!this.isListening) {
			this.logger.warn("Listener process is not running");
			return;
		}
		this.listenerProcess.send({ flag: MessageFlags.STOP });
		await this.waitForStop();
		this.logger.info("Stopping listener process");
	}
}
