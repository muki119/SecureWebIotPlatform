import type { EventPayload } from "@services/eventbus";
import { ProfileModelInstance } from "../../models";

export default async function HandleUserUpdated(
	message: EventPayload,
): Promise<void> {
	try {
		if (!message) {
			throw new Error("Missing message in event payload");
		}
		const { id, changes } = message.message;
		if (!id || !changes) {
			throw new Error("Missing required fields in message");
		}
		const changesArr = JSON.parse(changes); // changes is strignified so it can be passed - the event bus has a flat payload - only like 2 layers of depth
		// should probably check that these changes are even needed for this service- if not then its going to cause errors
		await ProfileModelInstance.update(id, changesArr);
		return;
	} catch (err) {
		throw new Error("Error handling USER_UPDATED event: ", { cause: err });
	}
}
