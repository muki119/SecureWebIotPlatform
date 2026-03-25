import { type EventPayload } from "@services/eventbus";
import { ProfileModelInstance, DomainModelInstance } from "../../models";

export default async function HandleUserDeleted(message: EventPayload): Promise<void> {
    try {
        const { id } = message!.message;
        if (!id) {
            throw new Error("Missing required fields in message");
        }
        await DomainModelInstance.multiTableTransaction(async (conn) => {
            await DomainModelInstance.deleteByOwnerId(id, conn)
            await ProfileModelInstance.delete(id, conn)
        });
    } catch (err) {
        throw new Error("Error handling USER_DELETED event: ", { cause: err });
    }
}