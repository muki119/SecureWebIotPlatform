import type { Role } from "@services/common/types";
import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "../../models";

export async function DomainCreatedHandler(message: EventPayload) {
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
		await UserRoleModelInstance.create({
			userId: userRole.userId,
			domainId: userRole.domainId,
			role: userRole.role as Role,
		}); // create the new role in the database
	} catch (error) {
		throw new Error("Failed to process domain created event", {
			cause: error,
		});
	}
}
