import { PostgresAssociationModel, PostgresDatabaseModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool } from "pg"
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
    canManageUsers: boolean, // allows crud of user in domain 
    canManageDevices: boolean, // allows crud of devices in domain
    canManageDomain: boolean, // can update domain details
    canControlDevices: boolean,
}
const VALID_ROLES: { [key: string]: rolePermissions } = {
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
    public async create(item: ModelDTO<IUserRole>): Promise<IUserRole> {
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const insertQuery = `
                INSERT INTO user_roles (user_id, domain_id, role)
                VALUES ($1, $2, $3)
                RETURNING user_id AS userId, domain_id AS domainId, role
            `
                const values = [item.userId, item.domainId, item.role]
                const result = await conn.query(insertQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to create user role association")
                }
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                return result.rows[0]
            } catch (error) {
                await conn.query("ROLLBACK")
                throw error
            }
        })
    }

    public async updateRole(userId: string, domainId: string, newRole: string): Promise<UpdateResult<IUserRole>> { // must be domain owner to update user role association - checked in the service layer
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const updateQuery = `
                    UPDATE user_roles
                    SET role = $3
                    WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
                    RETURNING user_id AS userId, domainId AS domainId, role
                `
                const values = [userId, domainId, newRole]
                const result = await conn.query(updateQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("No user role association found for the given user and domain")
                }
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                return result.rows[0]
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to update user role : ", { cause: error })
            }
        })
    }

    public async delete(userId: string, domainId: string): Promise<void> { // must be domain owner to delete user role association - checked in the service layer
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
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
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
            } catch (error) {
                await conn.query("ROLLBACK")
                throw error
            }
        })
    }
}

export const UserRoleModelInstance = new UserRoleModel(PostgresPool)