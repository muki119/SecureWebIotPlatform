import { type EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "../../models";

export async function UserDeletedHandler(message: EventPayload): Promise<void> {
    try {
        const { id } = message!.message;
        if (!id) {
            throw new Error("Missing required fields in message");
        }
        const [_, err] = await UserRoleModelInstance.deleteByUserId(id);
        if (err) {
            throw new Error("Error deleting user roles: ", { cause: err });
        }
    } catch (err) {
        throw new Error("Failed to process user deleted event: ", { cause: err });
    }
}