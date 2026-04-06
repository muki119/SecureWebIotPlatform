import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "@services/domain/src/models";
export async function DomainUserRemovedHandler(message: EventPayload) {
    try {
        const userDomainInfo = message?.message;
        if (!userDomainInfo || typeof userDomainInfo === "string" || !userDomainInfo.userId || !userDomainInfo.domainId) {
            throw new Error("No user domain information in payload");
        }
        await UserRoleModelInstance.delete(userDomainInfo.userId, userDomainInfo.domainId) // delete the role associated with the deleted user in the database - this is necessary to ensure that if the user is re-added to the domain later, they don't have any lingering permissions from their previous membership
    } catch (error) {
        throw new Error("Failed to process domain user removed event", { cause: error });
    }
}