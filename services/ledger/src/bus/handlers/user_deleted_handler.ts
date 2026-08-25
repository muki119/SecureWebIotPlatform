import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance } from "../../models";

export async function UserDeletedHandler(message: EventPayload): Promise<void> {
	try {
		if (!message?.message || typeof message.message === "string") {
			throw new Error("Invalid message payload");
		}
		const { id } = message.message;
		if (!id) {
			throw new Error("Missing required fields in message");
		}
		await UserRoleModelInstance.deleteByUserId(id);
	} catch (err) {
		throw new Error("Error handling USER_DELETED event: ", { cause: err });
	}
}
