import type { ModelDTO, ServiceResult } from "@services/common/types";
import { type IProfile, UserDomainModelInstance } from "../../models";
export default async function GetDomainUsersService(
	userId: string,
	domainId: string,
	limit: number,
	offset: number,
): Promise<
	ServiceResult<ModelDTO<IProfile & { role: string; dateJoined: Date }>[]>
> {
	try {
		const isUserInDomain = await UserDomainModelInstance.isDomainMember(
			userId,
			domainId,
		);
		if (!isUserInDomain) {
			return [null, Error("User is not a member of the domain")];
		}
		const users = await UserDomainModelInstance.findAllByDomainId(
			domainId,
			limit,
			offset,
		); // its ok to return empty array
		return [users, null];
	} catch (error) {
		throw new Error("Failed to get user domains: ", { cause: error });
	}
}
