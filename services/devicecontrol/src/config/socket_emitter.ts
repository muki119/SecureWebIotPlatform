import { Emitter } from "@socket.io/redis-emitter";
import { createClient } from "redis";
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";

export async function CreateSocketEmitter() {
    const redisClient = createClient({
        socket: {
            host: GetEnvString("REDIS_HOST", "localhost"),
            port: GetEnvNumber("REDIS_PORT", 6379)
        },
        password: GetEnvString("REDIS_PASSWORD", ""), // add password if needed
        database: GetEnvNumber("REDIS_DB", 0),
    });

    await redisClient.connect()
    return new Emitter(redisClient);
}


export const SocketEmitterInstance = await CreateSocketEmitter(); // only used by event bus worker since would have to create seperte server instance for bus which is too problematic
