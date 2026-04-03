import type { ServiceResult, IUserRole } from "@services/common/types";
import { UserRoleModelInstance, ROLES } from "../../models";


export default async function UpdateUserRoleService(updater: string, updatee: string, newRole: string, domainId: string): Promise<ServiceResult<IUserRole>> {
    try {

        if (updatee === updater) {
            return [null, new Error("Cannot change your own role")];
        }
        if (newRole.toUpperCase() === ROLES.OWNER) {
            return [null, new Error("Cannot assign owner role , must be done through transfer ownership")];
        }
        const updaterPermissions = await UserRoleModelInstance.userPermissions(updater, domainId);

        if (!updaterPermissions) {
            return [null, new Error("Updater not a member of the domain")];
        }
        if (!updaterPermissions?.canManageUsers) { // if they cant change user roles - reject
            return [null, new Error("Updater is not allowed to manage users")];
        }
        const updateePermissions = await UserRoleModelInstance.userPermissions(updatee, domainId);// check if the updatee is a member of the domain

        if (!updateePermissions) {
            return [null, new Error("Updatee not a member of the domain")];
        }
        if (updateePermissions?.isOwner) { // if they are an owner - reject
            return [null, new Error("Cannot change the role of an owner")];
        }
        if (updateePermissions.role === newRole.toUpperCase()) {
            return [null, new Error("New role is the same as the current role")];
        }
        const [updatedRole, error] = await UserRoleModelInstance.updateRole(updatee, domainId, newRole.toUpperCase());
        if (error) {
            return [null, error];
        }
        if (!updatedRole) {
            return [null, new Error("Role updated but updated role was not returned")];
        }
        return [updatedRole, null];
    } catch (error) {
        throw new Error("Failed to update role", { cause: error });
    }
}