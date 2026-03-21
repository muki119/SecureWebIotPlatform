import { DomainModelInstance, type IDomain } from "../../models";
import { type ServiceResult } from "@services/common/types";
export default async function GetUserDomainsService(userId: string, limit: number, offset: number): Promise<ServiceResult<IDomain[]>> {
    try {
        const domains = await DomainModelInstance.findByUserId(userId, limit, offset); // its ok to return empty array
        return [domains, null];
    } catch (error) {
        throw new Error("Failed to get user domains: ", { cause: error })
    }
}