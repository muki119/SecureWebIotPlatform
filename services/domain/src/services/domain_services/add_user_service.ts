import { UserDomainModelInstance, UserRoleModelInstance, ROLES } from "../../models";
import { type ServiceResult } from "@services/common/types";

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
        const inviterIsAllowed = (await UserRoleModelInstance.userPermissions(inviter, domainId)).canManageUsers
        if (!inviterIsAllowed) {
            return [null, new Error("You are not allowed to manage users in this domain")]
        }
        await UserDomainModelInstance.multiTableTransaction(async (conn) => {
            await UserDomainModelInstance.create({ userId: invitee, domainId }, conn)
            await UserRoleModelInstance.create({ userId: invitee, domainId, role }, conn)
        })
        return [true, null]
    } catch (error) {
        throw new Error("Failed to add user to domain: ", { cause: error })
    }

}