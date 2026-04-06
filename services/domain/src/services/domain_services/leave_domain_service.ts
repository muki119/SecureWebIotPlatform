import { UserDomainModelInstance, UserRoleModelInstance } from "../../models"
import { type ServiceResult } from "@services/common/types";
import EventBusInstance from "../../config/event_bus";
import { STREAMS } from "@services/common/config"
export default async function LeaveDomainService(userId: string, domainId: string): Promise<ServiceResult<boolean>> {
    try {
        const isUserMember = await UserRoleModelInstance.userPermissions(userId, domainId)
        if (!isUserMember) { // user has to be a member of the domain to leave it
            return [null, new Error("User is not a member of the domain")];
        }
        if (isUserMember.isOwner) { // owner cannot leave the domain - ownership has to be transferred first
            return [null, new Error("Owner cannot leave the domain, ownership must be transferred first or the domain must be deleted")];
        }
        await UserDomainModelInstance.multiTableTransaction(async (conn) => {
            await UserDomainModelInstance.delete(userId, domainId, conn)
            await UserRoleModelInstance.delete(userId, domainId, conn)
        })
        await EventBusInstance.send(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_REMOVED, { userId, domainId }) // send the deleted user id and domain id to the event bus
        return [true, null];
    } catch (error) {
        throw new Error("Failed to leave domain", { cause: error });
    }
}