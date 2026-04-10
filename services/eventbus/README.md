# Event Bus

This Module is an abstraction layer for the Redis' Streams data structure.

It provides a super simple API to publish and subscribe to streams without worrying about the intricacies of the Redis implementation.

The overall api follows a pattern similar to Socket.io/Http servers and also a smidge of React hooks.

This module runs as a worker process. This is so the application can work alongside the main server process without hindering each other's performance.

## Components

### EventBus

The main instance to be used by the main server process, this manages the lifecycle of the worker process and provides the ability to send data to a stream.

### BaseWorker

The base worker class is the class that the worker process runs. It controls the lifecycle of the listener component and communicates with the EventBus instance in the main process through an ipc channel.

To use the BaseWorker class, you need to extend it and implement the `onCreate` method, which is where you can register the streams to listen to and the handlers for those streams.

In addition, in the `onCreate` method, you can also declare a handler for errors that may occur in the worker process by using the `errorHandler` method.

### Event Bus Components

The Event Bus Components are the components used by the worker process and the EventBus instance to communicate on the streams.

The components are the lowest level of abstraction, but can be used without the EventBus and BaseWorker classes if needed.

It attempts to be as asynchronous as possible and implements semaphores as a mechanism to prevent too many operations from being executed at the same time and overwhelming the system.

For a message in a stream to be acknowledged, it must be processed without throwing any errors.

## API

### Pre-requisites

- A Redis server must be running (since this is a REDIS STREAMS abstraction)

### EventBus

#### `const EventBusInstance = new EventBus(config: EventBusConfig, logger: Logger, workerDir: string)`

Creates a new EventBus instance.

- `config` is the configuration object for the event bus instance and the worker process.

    The `EventBusConfig` type is defined as follows:

    ``` TypeScript

    export interface RedisConfig {
        host: string;
        port: number;
        password: string;
        db: number;
    };

    export type EventBusConfig = {
        connectionOptions: RedisClientOptions | RedisConfig;
        consumerGroup: string;
        consumerName: string;
        maxCount: number;
        maxConcurrent: number;
    };

    ```

    - `connectionOptions` is the configuration for the Redis client used by the components to connect to the Redis server. Can either conform to the `RedisConfig` type or the `RedisClientOptions` type from the `redis` library.

    - `consumerGroup` is the name of the consumer group that the listener process will be a part of; this is used so that multiple instances of the application can run without the messages being duplicated across the instances.

    - `consumerName` is the name of the consumer that the listener process will be using; this is used to identify the consumer in the consumer group.

    - `maxCount` is the maximum number of messages that the listening process can pull from each stream.

    - `maxConcurrent` is the maximum number of messages that can be processed at the same time by the listening process. This is used to prevent overwhelming the system with too many messages being processed at the same time.

- `Logger` is a pino logger instance

- `workerDir` is the directory of the worker process file; this is used to start the worker process.

#### `EventBusInstance.init()` - Async

Initialises the EventBus instance.
Starts the worker process and establishes the communication channel between the main process and the worker process.

#### `EventBusInstance.start()`

Starts the EventBus instance.
The listening process in the worker process will start listening to registered streams.

#### `EventBusInstance.send(stream: string, Message: any)` - Async

Sends data to a specific stream.
The Message can be any serializable data, though if using objects, its depth is limited to 1 level of nesting.

So it's recommended to use Stringified Objects for complex data.

#### `EventBusInstance.stop()` - Async

- Stops the EventBus instance.

- Since the listening component runs using semaphores, the stop is not instant and naturally graceful as it waits for all semaphore tokens to be returned before fully stopping the listening process.

## Example Usage

### Creating a worker process

``` TypeScript

import { BaseWorker } from "@services/eventbus";
//...other imports
export class ExampleServiceWorker extends BaseWorker {
    onCreate() {
        this.handler("user_created", UserCreatedHandler) // when a message on the user_created stream appears, take the message and pass it to the handler function to be processed

        this.handler("user_updated", UserUpdatedHandler) 
        this.handler("user_deleted", UserDeletedHandler)

        this.errorHandler((error, payload) => { // if any error is thrown by a handler, it will be caught here.
            console.log(error)
        })
    }
}

const worker = new ExampleServiceWorker();
worker.start();

```

### Handler Function

A handler function must take in a message and return a void Promise

``` TypeScript
async function UserCreatedHandler(message):Promise<void> {
    //... do sometihing 
}
```

### EventBus Instance

``` TypeScript
const eventBusConfig = {
    connectionOptions: {
        host: GetEnvString("EVENT_BUS_REDIS_HOST", "localhost"),
        port: GetEnvNumber("EVENT_BUS_REDIS_PORT", 6379),
        password: GetEnvString("EVENT_BUS_REDIS_PASSWORD", ""),
        db: GetEnvNumber("EVENT_BUS_REDIS_DB", 0),
    },
    consumerGroup: CONSUMER_GROUPS.DOMAIN_SERVICE,
    consumerName: `${CONSUMER_GROUPS.DOMAIN_SERVICE}:${hostname()}`,
    maxCount: 10,
    maxConcurrent: 100,
}

const EventBusInstance = new EventBus(
    eventBusConfig,
    logger,
    "./src/bus/domain_service_worker.js",
);

EventBusInstance.init();
EventBusInstance.start();
```

### Sending a message to a stream

``` TypeScript

EventBusInstance.send("user_created", {
    userId: "123",
    name: "John Doe",
    email: "john.doe@example.com"
})

```

### Graceful Shutdown

``` TypeScript
await EventBusInstance.stop();
```
