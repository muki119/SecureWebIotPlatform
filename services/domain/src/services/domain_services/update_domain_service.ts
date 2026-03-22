import type { ServiceResult, UpdatePatch } from "@services/common/types";
import { DomainModelInstance, UserRoleModelInstance, type IDomain } from "../../models";
export default async function UpdateDomainService(userId: string, domainId: string, updates: UpdatePatch<IDomain>): Promise<ServiceResult<IDomain>> {
    try {
        const userPermissions = await UserRoleModelInstance.userPermissions(userId, domainId);
        if (!userPermissions) {
            return [null, new Error("User not a member of the domain")];
        }
        if (!userPermissions?.canManageDomain) {
            return [null, new Error("User is not allowed to manage the domain")];
        }
        const [updatedDomain, error] = await DomainModelInstance.update(domainId, updates)
        if (error) {
            return [null, error];
        }
        if (!updatedDomain) {
            return [null, new Error("Failed to update domain")];
        }
        return [updatedDomain, null];
    } catch (error) {
        throw new Error("Failed to update domain", { cause: error });
    }
}