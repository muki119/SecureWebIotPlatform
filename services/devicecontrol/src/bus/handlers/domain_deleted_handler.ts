import type { EventPayload } from "@services/eventbus";
import { SocketEmitterInstance } from "../../config";
import { SOCKET_EVENTS } from "../../constants/";

export async function DomainDeletedHandler(message: EventPayload) {
    try {
        // get role info from payload
        const { domainId } = message?.message;
        if (!domainId || typeof domainId !== "string") {
            throw new Error("No domain information in payload");
        }
        SocketEmitterInstance.to(domainId).emit(SOCKET_EVENTS.SERVER_EMITTED.DOMAIN.DELETED, { domainId }); // notify connected clients that the domain has been deleted so they can update their UI accordingly
        SocketEmitterInstance.in(domainId).socketsLeave(domainId); // kick all sockets out of the room so they stop receiving stale domain events
    } catch (error) {
        throw new Error("Failed to process domain deleted event", { cause: error });
    }
}