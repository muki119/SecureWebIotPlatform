import { STREAMS } from "@services/common/config";
import { ROLES } from "@services/common/constants";
import type { ServiceResult } from "@services/common/types";
import EventBusInstance from "../../config/event_bus";
import {
	DomainModelInstance,
	type IDomain,
	type IUserDomain,
	UserDomainModelInstance,
	UserRoleModelInstance,
} from "../../models";
export default async function CreateDomainService(
	domainName: string,
	userID: string,
): Promise<ServiceResult<{ domain: IDomain; userDomain: IUserDomain }>> {
	try {
		const result = await DomainModelInstance.multiTableTransaction(
			async (conn) => {
				const newDomain = await DomainModelInstance.create(
					{ name: domainName, ownerId: userID },
					conn,
				); // create a new domain
				const userDomain = await UserDomainModelInstance.create(
					{ userId: userID, domainId: newDomain.id },
					conn,
				); // create a new user-domain relationship
				const ownerRole = await UserRoleModelInstance.create(
					{
						userId: userID,
						domainId: newDomain.id,
						role: ROLES.OWNER,
					},
					conn,
				); // create a new user-role relationship with the role of owner
				if (!newDomain || !userDomain || !ownerRole) {
					throw new Error(
						"Failed to create domain or user-domain relationship or user-role relationship",
					);
				}
				return { domain: newDomain, userDomain, ownerRole };
			},
		);
		await EventBusInstance.send(
			STREAMS.DOMAIN_SERVICE.DOMAIN_CREATED,
			result.ownerRole,
		); // owner role is flat enough to not cause problems or need stringifying
		return [result, null];
	} catch (error) {
		throw new Error("Error in CreateDomainService", { cause: error });
	}
}
