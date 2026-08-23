import type { Role } from "@services/common/types";
import type { EventPayload } from "@services/eventbus";
import { SocketEmitterInstance } from "../../config";
import { SOCKET_EVENTS } from "../../constants/";
import { UserRoleModelInstance } from "../../models";
export async function DomainUserAddedHandler(message: EventPayload) {
	try {
		// get role info from payload
		const userRole = message?.message;
		if (
			!userRole ||
			typeof userRole === "string" ||
			!userRole.userId ||
			!userRole.domainId ||
			!userRole.role
		) {
			throw new Error("No user role information in payload");
		}

		const roleObj = {
			userId: userRole.userId,
			domainId: userRole.domainId,
		};
		await UserRoleModelInstance.create({
			...roleObj,
			role: userRole.role as Role,
		}); // create the new role in the database
		SocketEmitterInstance.in(userRole.userId).socketsJoin(
			userRole.domainId,
		);
		SocketEmitterInstance.to(userRole.domainId).emit(
			SOCKET_EVENTS.SERVER_EMITTED.DOMAIN.USER_ADDED,
			roleObj,
		); // notify connected clients
		SocketEmitterInstance.to(userRole.userId).emit(
			SOCKET_EVENTS.SERVER_EMITTED.USER.JOINED_DOMAIN,
			{
				domainId: userRole.domainId,
				userId: userRole.userId,
				role: userRole.role,
			},
		); // tell user theyve been added to a domain
	} catch (error) {
		throw new Error("Failed to process domain user added event", {
			cause: error,
		});
	}
}
