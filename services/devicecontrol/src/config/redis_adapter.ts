import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { GetEnvString, GetEnvNumber } from "@services/common/utilities";

const pubClient = createClient({
    socket: {
        host: GetEnvString("SOCKET_REDIS_HOST", "localhost"),
        port: GetEnvNumber("SOCKET_REDIS_PORT", 6379)
    },
    password: GetEnvString("SOCKET_REDIS_PASSWORD", ""), // add password if needed
    database: GetEnvNumber("SOCKET_REDIS_DB", 0),
});

const subClient = pubClient.duplicate();

await Promise.all([
    pubClient.connect(),
    subClient.connect()
]);
export const RedisAdapter = createAdapter(pubClient, subClient); // for server only - event bust worker cannot use this so it has to use emitter