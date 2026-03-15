import { PostgresAssociationModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool } from "pg"

export interface IUserDomain extends ModelSchema {
    userId: string,
    domainId: string,
}

export class UserDomainModel extends PostgresAssociationModel<IUserDomain> {

    protected fieldsMap = new Map<keyof ModelDTO<IUserDomain>, string>([
        // no updatable fields since this is just a join table between users and domains
        // if more custom fields are added then here
    ])
    constructor(db: Pool) {
        super(db)
    }
    public async create(item: ModelDTO<IUserDomain>): Promise<IUserDomain> {
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const insertQuery = `
                INSERT INTO user_domains (user_id, domain_id)
                VALUES ($1, $2)
                RETURNING user_id, domain_id
            `
                const values = [item.userId, item.domainId]
                const result = await conn.query(insertQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to create user domain association")
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
    public async delete(userId: string, domainId: string): Promise<void> { // must be domain owner or user to delete association - checked in the service layer
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const deleteQuery = `
                    UPDATE user_domains
                    SET deleted_at = NOW()
                    WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
            `
                const values = [userId, domainId]
                const result = await conn.query(deleteQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to delete user domain association")
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
    public async findAllByUserId(userId: string): Promise<IUserDomain[]> { // might have to be tabulated because a user can be a company or normal user and can have a bunch of domains -- will have to see
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT user_id, domain_id
                FROM user_domains
                WHERE user_id = $1 AND deleted_at IS NULL
            `
                const values = [userId]
                const result = await conn.query(query, values)
                return result.rows
            } catch (error) {
                throw new Error("Failed to find user domain associations: ", { cause: error })
            }

        })
    }

    public async findAllByDomainId(domainId: string): Promise<IUserDomain[]> { // will always return at least one since a domain needs an owner
        return this.poolWrap(async (conn) => {
            try {
                const query = ` 
                SELECT user_id, domain_id
                FROM user_domains
                WHERE domain_id = $1 AND deleted_at IS NULL
            ` // check for if the requester is in the domain will be done in the service layer - no need to find 
                const values = [domainId]
                const result = await conn.query(query, values)
                return result.rows
            } catch (error) {
                throw new Error("Failed to find user domain associations: ", { cause: error })
            }
        })
    }

}