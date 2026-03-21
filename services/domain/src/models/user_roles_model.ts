import { PostgresAssociationModel, PostgresDatabaseModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool, type PoolClient } from "pg"
import { PostgresPool } from "../config/postgres"


export interface IUserRole extends ModelSchema {
    userId: string,
    domainId: string,
    role: string,
}
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



type rolePermissions = {
    isOwner: boolean, // allows domain deletion and transfer of ownership
    /**
     * canManageUsers - allows crud of user in domain , can add users,update user roles and delete users from domain
     */
    canManageUsers: boolean, // allows crud of user in domain 
    /**
     * canManageDevices - allows crud of devices in domain , can add devices, update device details and delete devices from domain
     */
    canManageDevices: boolean, // allows crud of devices in domain
    /**
     * canManageDomain - allows updating of domain details such as name 
     */
    canManageDomain: boolean, // can update domain details
    /**
     * canControlDevices - allows control of devices in domain - the most basic permission
     */
    canControlDevices: boolean,
}
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

export class UserRoleModel extends PostgresAssociationModel<IUserRole> {

    protected fieldsMap = new Map<keyof ModelDTO<IUserRole>, string>([
        ["role", "string"], // only role can be updated in the user role association, theres no need to update any other fields since theyre identifiers and metadata
    ])
    constructor(db: Pool) {
        super(db)
    }
    public async create(item: ModelDTO<IUserRole>, externalConn?: PoolClient): Promise<IUserRole> {
        return this.transactionWrap(async (conn) => {
            try {
                if (!item.role || !(item.role in ROLES)) {
                    throw new Error("Invalid role specified")
                }
                const insertQuery = `
                INSERT INTO user_roles (user_id, domain_id, role)
                VALUES ($1, $2, $3)
                RETURNING user_id AS "userId", domain_id AS "domainId", role
            `
                const values = [item.userId, item.domainId, item.role]
                const result = await conn.query(insertQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to create user role association")
                }
                return result.rows[0]
            } catch (error) {
                throw new Error("Failed to create user role association: ", { cause: error })
            }
        }, externalConn)
    }

    public async userPermissions(userId: string, domainId: string): Promise<rolePermissions> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT role 
                FROM user_roles 
                WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL`
                const values = [userId, domainId]
                const result = await conn.query(query, values)
                if (result.rowCount === 0) {
                    throw new Error("No user role association found for the given user and domain")
                }
                const userRole = result.rows[0].role
                if (!(userRole in ROLE_PERMISSIONS)) {
                    throw new Error("Invalid role found for user in domain")
                }
                return ROLE_PERMISSIONS[userRole]!
            } catch (error) {
                throw new Error("Failed to get user permissions: ", { cause: error })
            }
        })
    }

    public async updateRole(userId: string, domainId: string, newRole: string): Promise<UpdateResult<IUserRole>> { // must be domain owner to update user role association - checked in the service layer
        return this.transactionWrap(async (conn) => {
            try {
                if (!(newRole in ROLES)) {
                    throw new Error("Invalid role specified")
                }
                const updateQuery = `
                    UPDATE user_roles
                    SET role = $3
                    WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
                    RETURNING user_id AS "userId", domain_id AS "domainId", role
                `
                const values = [userId, domainId, newRole]
                const result = await conn.query(updateQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("No user role association found for the given user and domain")
                }
                return result.rows[0]
            } catch (error) {
                throw new Error("Failed to update user role : ", { cause: error })
            }
        })
    }

    public async delete(userId: string, domainId: string, externalConn?: PoolClient): Promise<void> { // must be domain owner to delete user role association - checked in the service layer
        return this.transactionWrap(async (conn) => {
            try {
                const deleteQuery = `
                    UPDATE user_roles
                    SET deleted_at = NOW()
                    WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
            `
                const values = [userId, domainId]
                const result = await conn.query(deleteQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to delete user role association")
                }
            } catch (error) {
                throw new Error("Failed to delete user role association: ", { cause: error })
            }
        }, externalConn)
    }
}

export const UserRoleModelInstance = new UserRoleModel(PostgresPool)