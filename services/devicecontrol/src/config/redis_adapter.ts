import { GetEnvNumber, GetEnvString } from "@services/common/utilities";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export async function CreateRedisAdapter() {
	const pubClient = createClient({
		socket: {
			host: GetEnvString("SOCKET_REDIS_HOST", "localhost"),
			port: GetEnvNumber("SOCKET_REDIS_PORT", 6379),
		},
		password: GetEnvString("SOCKET_REDIS_PASSWORD", ""), // add password if needed
		database: GetEnvNumber("SOCKET_REDIS_DB", 0),
	});

	const subClient = pubClient.duplicate();

	await Promise.all([pubClient.connect(), subClient.connect()]);

	return createAdapter(pubClient, subClient); // for server only - event bust worker cannot use this so it has to use emitter
}
