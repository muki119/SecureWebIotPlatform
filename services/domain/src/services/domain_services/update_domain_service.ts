import { STREAMS } from "@services/common/config";
import type { ServiceResult, UpdatePatch } from "@services/common/types";
import EventBusInstance from "../../config/event_bus";
import {
	DomainModelInstance,
	type IDomain,
	UserRoleModelInstance,
} from "../../models";
export default async function UpdateDomainService(
	userId: string,
	domainId: string,
	updates: UpdatePatch<IDomain>,
): Promise<ServiceResult<IDomain>> {
	try {
		const userPermissions = await UserRoleModelInstance.userPermissions(
			userId,
			domainId,
		);
		if (!userPermissions) {
			return [null, new Error("User not a member of the domain")];
		}
		if (!userPermissions?.canManageDomain) {
			return [
				null,
				new Error("User is not allowed to manage the domain"),
			];
		}
		const [updatedDomain, error] = await DomainModelInstance.update(
			domainId,
			updates,
		);
		if (error) {
			return [null, error];
		}
		if (!updatedDomain) {
			return [null, new Error("Failed to update domain")];
		}
		await EventBusInstance.send(STREAMS.DOMAIN_SERVICE.DOMAIN_UPDATED, {
			domainId,
			changes: JSON.stringify(updates),
			initiatorId: userId,
		}); // send the updated domain info to the event bus - we can send the whole updated domain or just the changes - for now we will send just the changes and the domain id and let the other services decide if they want to fetch the updated domain info or not
		return [updatedDomain, null];
	} catch (error) {
		throw new Error("Failed to update domain", { cause: error });
	}
}
