import { RedisClientOptions, RedisClientType, RedisDefaultModules, createClient } from "redis";
export interface RedisConfig {
    host: string;
    port: number;
    password: string;
    db: number;
}


export type EventBusConfig = {
    connectionOptions: RedisClientOptions | RedisConfig;
    consumerGroup: string;
    consumerName: string;
    maxCount: number;
    maxConcurrent: number;
};

type EventPayload = {
    id: string;
    values: Map<string, any>;
}
type Stream = string;
export type EventBusHandler = (payload: EventPayload) => Promise<void>;

type EventBusMessage = {
    [key: string]: any;
}

/**
 * 
 * @param options - connection options
 * @returns - the connection instance
 * @description - makes a non pooled connection to redis
 */
async function createConnection(options: RedisClientOptions) {
    try {
        const client = await createClient(options);
        client.on("error", (err) => {
            console.error("Redis Client Error", err);
            throw new Error("Redis Client Error: " + err);
        });
        await client.connect()
        console.log("Connected to Redis successfully.");
        return client;
    } catch (error) {
        throw new Error(`Unable to connect to Redis: ${error}`);
    }

}



export class EventSender { // this will only act as a sender - might have to be pool because 1 connection can only do so much if getting like a bunch of messages per second then this is the bottleneck
    private conn!: ReturnType<typeof createClient>;
    private config: EventBusConfig;
    constructor(config: EventBusConfig) {
        this.config = config;
    }
    /**
     * @description - initialises the sender by making a connection
     */
    async init() {
        this.conn = await createConnection(this.config.connectionOptions);
    }

    /**
     * 
     * @param stream  - the stream to send the message to 
     * @param message - the message to send 
     * @description - sends a message to a given stream
     */
    public async send(stream: Stream, message: EventBusMessage) {
        if (!stream || !message) {
            throw new Error("Stream and message must be provided", {
                cause: {
                    missing: !stream ? "stream" : "message"
                }
            });
        }
        try {
            const id = await this.conn.xAdd(stream, "*", message);
            if (!id) {
                throw new Error("Failed to add message to stream " + stream);
            }
        } catch (error: any) {
            throw new Error(`Error while sending message to stream "${stream}"`, { cause: error });
        }

    }

}

export class EventListener { // this will only act as a listner 
    private listenerConn!: ReturnType<typeof createClient>; // for listening to messages - is blocking 
    private nonBlockingConn!: ReturnType<typeof createClient>; // for non-blocking commands like xAck - since the listening connection is blocked on xReadGroup it cant be used for other commands
    private config: EventBusConfig;
    private consumerGroup: string;
    private consumerName: string;
    private handlerTable: Map<string, EventBusHandler>;
    private listening: boolean;
    private maxCount: number;
    private semaphore: semaphore; // to limit the number of concurrent message processing to maxCount

    constructor(config: EventBusConfig) {
        this.config = config;
        this.consumerGroup = config.consumerGroup;
        this.consumerName = config.consumerName;
        this.handlerTable = new Map<string, EventBusHandler>(); // all handlers have to be registered before listen is called
        this.listening = false; // wanted to make this atomic but node dosent have atomic values in stdlib
        this.maxCount = config.maxCount || 100; // should be kinda readonly
        this.semaphore = new semaphore(config.maxConcurrent || 10);
    }

    /**
     * @description initialises the listner , creates the consumer groups and starts processing any pending messages not ack or claimed for soem reason
     */
    private async init(): Promise<void> {
        try {
            this.listenerConn = await createConnection(this.config.connectionOptions);
            this.nonBlockingConn = this.listenerConn.duplicate(); // this connection is for non blocking commands like xAck - since the listening connection is blocked on xReadGroup it cant be used for other commands
            await this.nonBlockingConn.connect()
            const streams = Array.from(this.handlerTable.keys());
            for (const stream of streams) {
                try {
                    await this.listenerConn.xGroupCreate(stream, this.consumerGroup, "0-0", { MKSTREAM: true });
                } catch (error: any) {
                    if (!error.message.includes("BUSYGROUP")) { // if the group already exists then ignore the error
                        throw new Error(`Error creating consumer group for stream "${stream}"`, { cause: error });
                    }
                }
            }
            this.processPendingMessages().catch((error) => {
                throw new Error(`Error processing pending messages: `, { cause: error });
            });
        } catch (error: any) {
            throw new Error(`Error during EventListener initialization`, { cause: error });
        }
    }

    private async processPendingMessages(): Promise<void> {
        const streams = Array.from(this.handlerTable.keys()).map((stream) => ({ key: stream, id: "0" }));
        for (const stream of streams) {
            const messages = await this.listenerConn.xAutoClaim(
                stream.key,
                this.consumerGroup,
                this.consumerName,
                60 * 1000, // claim messages that have been pending for more than 60 seconds
                stream.id,
                { COUNT: this.maxCount }
            )
            //console.log("pending messages: " + JSON.stringify(messages));
            if (!messages || messages.messages.length === 0) {
                continue;
            }

            this.processStream({ name: stream.key, messages: messages.messages });

        }
    }

    public isListening(): boolean {
        return this.listening;
    }


    /**
     * 
     * @param stream - the name of the stream to listen to
     * @param handler - the function to handle incomming messages for that stream
     * @description - registers a handler for a specified stream
     * should be registered before listening starts
     */
    public registerHandler(stream: Stream, handler: EventBusHandler) {
        try {
            if (this.listening) {
                throw new Error("Cannot register handler while listening");
            }
            if (!stream || !handler) {
                throw new Error("Stream and handler must be provided", {
                    cause: {
                        missing: !stream ? "stream" : "handler"
                    }
                });
            }
            if (this.handlerTable.has(stream)) {
                throw new Error(`Handler already registered for stream "${stream}"`);
            }
            this.handlerTable.set(stream, handler);
        } catch (error: any) {
            throw new Error(`Error registering handler for stream "${stream}"`, { cause: error });
        }

    }

    /**
     * @description - begins listening for messages on the registered streams
     */
    public async listen() {

        try {
            await this.init(); // wait for initial things to be ready

            this.listening = true;
            const streams = Array.from(this.handlerTable.keys()).map((stream) => ({ key: stream, id: ">" }));
            while (this.listening) {
                const incommingStreams = await this.listenerConn.xReadGroup(
                    this.consumerGroup,
                    this.consumerName,
                    streams,
                    { COUNT: this.maxCount, BLOCK: 2 * 1000 }
                );
                if (!incommingStreams) {
                    continue;
                }
                for (const stream of incommingStreams) { // for every stream with messages
                    this.processStream(stream) // process stream - no need to await it because semaphore will handle maximum in queue
                }
            }
        } catch (error: any) {
            throw new Error(`Error while listening for messages`, { cause: error });
        }
    }


    /**
     * 
     * @param stream - the stream object containing the messages to process
     * @description - processes messages for a stream by calling its handler and then acknowledging once completed
     */
    private async processStream(stream: { [key: string]: any }): Promise<void> {
        const streamName = stream.key || stream.name;// depending on if its from pending messages or new messages the key might be different
        try {
            if (!stream) {
                throw new Error("Invalid stream");
            }

            const handler = this.handlerTable.get(streamName);
            if (!handler) {
                throw new Error(`No handler registered for stream "${streamName}"`);
            }
            for (const message of stream.messages) {
                await this.semaphore.acquire(); // wait for a slot to be available for processing
                handler(message).then(() => { // trying to make this as async as possible -> just handles a message and then releases a semaphore slot-> its async so it will just fire the handler and then go on to a next message , but if no slot left it will hold until
                    this.nonBlockingConn.xAck(streamName, this.consumerGroup, message.id);
                }).finally(() => {
                    this.semaphore.release();
                });
            }
            console.log("Finished processing messages for stream " + streamName);
        } catch (error: any) {
            throw new Error(`Error processing stream "${streamName}"`, { cause: error });
        }
    }

    /**
     * @description - stops listening for messages and closes all connections
     */
    public async close(): Promise<void> {
        // close listening process
        this.listening = false; // close the while loop
        await this.semaphore.wait() // wait for all processing to finish 
        this.listenerConn.quit(); // then close all the connections
        this.nonBlockingConn.quit();
    }

}

/**
 * @description Just a semaphore implementation because NodeJs doesnt have any built in atomics
 */

class semaphore {
    private count: number; // somehow node dosent have atomic values or mutextes in the stdlib so this will do - if there any multithreading then this might break
    private maxCount: number;
    constructor(count: number) {
        this.maxCount = count; // dosent need to be atomic since the event queue
        this.count = count;
    }

    block = () => new Promise((resolve) => setTimeout(resolve, 100)); // basically just blocks for 100ms - makes a promise for a async function to await on

    public async acquire(): Promise<void> {
        while (this.count <= 0) {
            await this.block();
        }
        this.count--;
    }

    public release(): void {
        this.count++;
    }

    public async wait(): Promise<void> {
        while (this.count < this.maxCount) {
            await this.block();
        }
    }

}