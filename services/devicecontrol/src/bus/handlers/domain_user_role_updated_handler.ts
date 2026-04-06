import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "../../models";
import type { Role } from "@services/common/types";

export async function DomainUserRoleUpdatedHandler(message: EventPayload) {
    try {
        // get role info from payload
        const userRoleUpdate = message?.message;
        if (!userRoleUpdate || typeof userRoleUpdate === "string" || !userRoleUpdate.userId || !userRoleUpdate.domainId || !userRoleUpdate.role) {
            throw new Error("No user role update information in payload");
        }
        // find the existing role in the database and update it with the new information
        // this is a bit redundant since the domain service already updates the role, but it ensures that the device control service has the most up-to-date information and can react to it if needed (for example, if a user is demoted from admin to user, we might want to immediately revoke their access to certain devices or features)
        await UserRoleModelInstance.updateRole(userRoleUpdate.userId, userRoleUpdate.domainId, userRoleUpdate.role.toUpperCase() as Role)
    } catch (error) {
        throw new Error("Failed to process domain user role updated event", { cause: error });
    }
}