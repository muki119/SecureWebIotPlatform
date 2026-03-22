import { DomainModelInstance, UserRoleModelInstance } from "../../models";
import { type ServiceResult } from "@services/common/types";
export default async function DeleteDomainService(userId: string, domainId: string): Promise<ServiceResult<boolean>> {
    try {
        // user is owner
        // set domain as deleted
        const isUserOwner = await UserRoleModelInstance.userPermissions(userId, domainId);
        if (!isUserOwner) {
            return [null, new Error("User has no role in the domain")];
        }
        if (!isUserOwner.isOwner) {
            return [null, new Error("User is not the owner of the domain")];
        }
        await DomainModelInstance.delete(domainId)
        return [true, null];
    } catch (error) {
        throw new Error("Failed to delete domain", { cause: error });
    }
}