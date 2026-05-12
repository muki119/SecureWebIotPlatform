import { type EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "../../models";

export async function UserDeletedHandler(message: EventPayload): Promise<void> {
    try {
        const { id } = message!.message;
        if (!id) {
            throw new Error("Missing required fields in message");
        }
        await UserRoleModelInstance.deleteByUserId(id);
    } catch (err) {
        throw new Error("Error handling USER_DELETED event: ", { cause: err });
    }
}