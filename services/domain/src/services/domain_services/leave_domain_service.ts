import { UserDomainModelInstance, UserRoleModelInstance } from "../../models"
import { type ServiceResult } from "@services/common/types";

export default async function LeaveDomainService(userId: string, domainId: string): Promise<ServiceResult<boolean>> {
    try {
        const isUserMember = await UserRoleModelInstance.userPermissions(userId, domainId)
        if (!isUserMember) { // user has to be a member of the domain to leave it
            return [null, new Error("User is not a member of the domain")];
        }
        if (isUserMember.isOwner) { // owner cannot leave the domain - ownership has to be transferred first
            return [null, new Error("Owner cannot leave the domain, ownership must be transferred first")];
        }
        await UserDomainModelInstance.multiTableTransaction(async (conn) => {
            await UserDomainModelInstance.delete(userId, domainId, conn)
            await UserRoleModelInstance.delete(userId, domainId, conn)
        })
        return [true, null];
    } catch (error) {
        throw new Error("Failed to leave domain", { cause: error });
    }
}