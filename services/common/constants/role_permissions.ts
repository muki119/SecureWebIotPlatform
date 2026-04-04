import { type rolePermissions } from "@services/common/types"

/**
 *  Owner
* * A domain owner has full control over a domain and its devices, including the ability to destroy the domain itself.  
 * Admin
 * * An admin has full control over a domain and its services, excluding the ability to destroy the domain itself. 
 * Member
 * * A member can control devices within the domain that an owner or admin has permitted.
 * Guest
 * * A guest can control devices permitted, though only for a period set by an admin or owner. 
 */
export const ROLES = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    MEMBER: "MEMBER",
    GUEST: "GUEST",
} as const

export const ROLE_PERMISSIONS: { [key: string]: rolePermissions } = {
    /**
     * Owner has all permissions ... since its the owner
     */
    OWNER: {
        isOwner: true,
        canManageUsers: true,
        canManageDevices: true,
        canManageDomain: true,
        canControlDevices: true,
    },
    /**
     * Admin has all permissions except ownership specific and domain management permissions , such as changing domain names
     */
    ADMIN: {
        isOwner: false,
        canManageUsers: true,
        canManageDevices: true,
        canManageDomain: false,
        canControlDevices: true,
    },
    /**
     * Mmember can only control devices - adding of devices should be left to the admins+
     */
    MEMBER: {
        isOwner: false,
        canManageUsers: false,
        canManageDevices: false,
        canManageDomain: false,
        canControlDevices: true,
    },
    /**
     * Guest can only control devices for a limited time
     */
    GUEST: {
        isOwner: false,
        canManageUsers: false,
        canManageDevices: false,
        canManageDomain: false,
        canControlDevices: true,
    }
} as const