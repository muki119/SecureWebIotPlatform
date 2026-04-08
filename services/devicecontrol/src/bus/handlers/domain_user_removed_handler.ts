import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "@services/domain/src/models";
import { SocketEmitterInstance } from "../../config";
import { SOCKET_EVENTS } from "../../constants/";
export async function DomainUserRemovedHandler(message: EventPayload) {
    try {
        const userDomainInfo = message?.message;
        if (!userDomainInfo || typeof userDomainInfo === "string" || !userDomainInfo.userId || !userDomainInfo.domainId) {
            throw new Error("No user domain information in payload");
        }
        const roleObj = { userId: userDomainInfo.userId, domainId: userDomainInfo.domainId };
        await UserRoleModelInstance.delete(userDomainInfo.userId, userDomainInfo.domainId) // delete the role associated with the deleted user in the database - this is necessary to ensure that if the user is re-added to the domain later, they don't have any lingering permissions from their previous membership
        SocketEmitterInstance.in(userDomainInfo.userId).socketsLeave(userDomainInfo.domainId);
        SocketEmitterInstance.to(userDomainInfo.domainId).emit(SOCKET_EVENTS.SERVER_EMITTED.DOMAIN.USER_REMOVED, roleObj); // notify connected clients
        SocketEmitterInstance.to(userDomainInfo.userId).emit(SOCKET_EVENTS.SERVER_EMITTED.USER.LEFT_DOMAIN, { domainId: userDomainInfo.domainId, userId: userDomainInfo.userId }); // tell user theyve been removed from a domain

    } catch (error) {
        throw new Error("Failed to process domain user removed event", { cause: error });
    }
}