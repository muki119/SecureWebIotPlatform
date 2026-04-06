import { UserDomainModelInstance, UserRoleModelInstance } from "../../models";
import { ROLES } from "@services/common/constants";
import { type Role, type ServiceResult } from "@services/common/types";
import EventBusInstance from "../../config/event_bus";
import { STREAMS } from "@services/common/config"



export default async function AddUserService(inviter: string, invitee: string, domainId: string, role: string): Promise<ServiceResult<boolean>> {
    // user domain model entry
    // user role model entry
    try {
        if (role === ROLES.OWNER) { // a user cannot be added as an owner - there will be a trnasfer ownership service at somepoint
            return [null, new Error("Cannot assign owner role to another user")]
        }
        const inviteeIsMember = await UserDomainModelInstance.isDomainMember(invitee, domainId)
        if (inviteeIsMember) { // Shouldnt really happen because frontend shouldnt even show an already added member - only way is through a non ui client or a race condition 
            return [null, new Error("User is already a member of the domain")]
        }
        const inviterIsAllowed = (await UserRoleModelInstance.userPermissions(inviter, domainId))
        if (!inviterIsAllowed) {
            return [null, new Error("Inviter has no role in the domain")]
        }
        if (!inviterIsAllowed.canManageUsers) {
            return [null, new Error("Inviter is not allowed to manage users in this domain")]
        }
        const result = await UserDomainModelInstance.multiTableTransaction(async (conn) => {
            await UserDomainModelInstance.create({ userId: invitee, domainId }, conn)
            const userRole = await UserRoleModelInstance.create({ userId: invitee, domainId, role: role.toUpperCase() as Role }, conn)
            if (!userRole) {
                throw new Error("Failed to create user role")
            }
            return userRole
        })
        await EventBusInstance.send(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ADDED, result) // send the new user role to the event bus - flat enough to not cause problems or need stringifying
        return [true, null]
    } catch (error) {
        throw new Error("Failed to add user to domain: ", { cause: error })
    }

}