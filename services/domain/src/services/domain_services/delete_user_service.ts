import { UserDomainModelInstance, UserRoleModelInstance } from "../../models"
import { type ServiceResult } from "@services/common/types";

export default async function DeleteUserService(userId: string, domainId: string, userToDelete: string): Promise<ServiceResult<boolean>> {
    try {
        if (userId === userToDelete) { // cannot delete self
            return [null, new Error("User cannot delete themselves from the domain")];
        }
        const isUserToDeleteMember = await UserRoleModelInstance.userPermissions(userToDelete, domainId)
        if (!isUserToDeleteMember) { // user to be deleted has to be member
            return [null, new Error("User is not a member of the domain")];
        }
        if (isUserToDeleteMember.isOwner) { // user to be deleted cannot be owner - ownership has to be transferred first
            return [null, new Error("Cannot delete the owner of the domain, ownership must be transferred first")];
        }
        const isUserAllowedToDelete = await UserRoleModelInstance.userPermissions(userId, domainId)
        if (!isUserAllowedToDelete) { // user performing the delete has to be a member
            return [null, new Error("User has no role in the domain")];
        }
        if (!isUserAllowedToDelete.canManageUsers) {// user performing the delete has to be admin or owner
            return [null, new Error("User is not allowed to manage users in this domain")];
        }
        await UserDomainModelInstance.multiTableTransaction(async (conn) => {
            await UserDomainModelInstance.delete(userToDelete, domainId, conn)
            await UserRoleModelInstance.delete(userToDelete, domainId, conn)
        })
        return [true, null];
    }
    catch (error) {
        throw new Error("Failed to delete user from domain", { cause: error });
    }
}