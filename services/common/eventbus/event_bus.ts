import { EventBusConfig, EventSender, EventMessage } from "./event_bus_components"
import { ChildProcess, fork } from "node:child_process"
import { MessageFlags } from "./base_worker"


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
export class EventBus { // comprises of the listener proccess and the sender function
    private logger: any;
    private config: EventBusConfig; // for potential retries
    private isListening: boolean;
    private listenerProcess: ChildProcess | null = null; // the listener process spawned
    private sender: EventSender;
    private workerFile: string;

    constructor(config: EventBusConfig, logger: any, workerDir: string) {
        this.config = config;
        this.logger = logger;
        this.isListening = false;
        this.workerFile = workerDir;
        this.listenerProcess = fork(this.workerFile, [], { env: process.env });
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
                    message
                }
            })
        }
        if (!message.action) {
            throw new Error("Message must have an action", {
                cause: {
                    message
                }
            })
        }
        return this.sender.send(stream, { ...message, timestamp: new Date().toISOString() } as EventMessage);
    }

    async init() {
        await this.sender.init()
        if (!this.listenerProcess) {
            throw new Error("Listener process not initialized");
        }
        this.listenerProcess.send({ flag: MessageFlags.CREATE, value: this.config });
        this.listenerProcess.on("message", (message: { flag: MessageFlags, value?: any }) => { // find if error
            switch (message.flag) { // this just creates some listner handlers - once this is set up then you dont have to add additional listeners
                case MessageFlags.ERROR:
                    this.logger.error("Error from listener process: " + message.value);
                    break;
                case MessageFlags.PONG:
                    this.logger.info("Received PONG from listener process");
                    break;
                default:
                    this.logger.warn("Unknown message flag received from listener process: " + message.flag);
            }
        })
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
    stop() {
        if (!this.listenerProcess) {
            throw new Error("Listener process not initialized");
        }
        if (!this.isListening) {
            this.logger.warn("Listener process is not running");
            return;
        }
        this.listenerProcess.send({ flag: MessageFlags.STOP });
        this.isListening = false;
        this.logger.info("Stopping listener manager");
    }
}