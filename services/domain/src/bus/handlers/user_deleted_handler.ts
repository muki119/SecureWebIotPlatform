import type { EventPayload } from "@services/eventbus";
import {
	DomainModelInstance,
	ProfileModelInstance,
	UserRoleModelInstance,
} from "../../models";

export default async function HandleUserDeleted(
	message: EventPayload,
): Promise<void> {
	try {
		if (!message) {
			throw new Error("Missing message in event payload");
		}
		const { id } = message.message;
		if (!id) {
			throw new Error("Missing required fields in message");
		}
		await DomainModelInstance.multiTableTransaction(async (conn) => {
			await DomainModelInstance.deleteByOwnerId(id, conn);
			await ProfileModelInstance.delete(id, conn);
			await UserRoleModelInstance.deleteByUserId(id, conn);
		});
	} catch (err) {
		throw new Error("Error handling USER_DELETED event: ", { cause: err });
	}
}
