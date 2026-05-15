import { UserRoleModelInstance, DomainModelInstance } from "../../models";
import { ROLES } from "@services/common/constants";
import { type ServiceResult } from "@services/common/types";
import EventBusInstance from "../../config/event_bus";
import { STREAMS } from "@services/common/config";

export default async function UpdateOwnerService(ownerId: string, newOwnerId: string, domainId: string): Promise<ServiceResult<null>> {
    try {
        if (ownerId === newOwnerId) {
            return [null, new Error("Cannot transfer ownership to yourself")]
        }
        const ownerPermissions = await UserRoleModelInstance.userPermissions(ownerId, domainId)
        if (!ownerPermissions?.isOwner) {
            return [null, new Error("User is not the owner of the domain")]
        }
        const newOwnerPermissions = await UserRoleModelInstance.userPermissions(newOwnerId, domainId)
        if (!newOwnerPermissions) {
            return [null, new Error("New owner is not a member of the domain")]
        }
        await UserRoleModelInstance.multiTableTransaction(async (conn) => {
            await UserRoleModelInstance.updateRole(ownerId, domainId, ROLES.ADMIN, conn)
            await UserRoleModelInstance.updateRole(newOwnerId, domainId, ROLES.OWNER, conn)
            await DomainModelInstance.updateOwner(domainId, newOwnerId, conn)
        })
        await EventBusInstance.send(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED, {
            userId: newOwnerId,
            domainId,
            role: ROLES.OWNER,
            initiatorId: ownerId
        })
        await EventBusInstance.send(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED, {
            userId: ownerId,
            domainId,
            role: ROLES.ADMIN,
            initiatorId: ownerId
        })
        return [null, null]
    } catch (error) {
        throw new Error("Failed to transfer domain ownership", { cause: error })
    }
}