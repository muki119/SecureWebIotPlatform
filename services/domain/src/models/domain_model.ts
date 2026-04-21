import { PostgresDatabaseModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool, type PoolClient } from "pg"
import { PostgresPool } from "../config/postgres"

export interface IDomain extends ModelSchema {
    id: string,
    name: string,
    ownerId: string,
}

export class DomainModel extends PostgresDatabaseModel<IDomain> {

    protected updatableFieldsMap = new Map<keyof ModelDTO<IDomain>, string>([
        ["name", "string"],
    ])
    constructor(db: Pool) {
        super(db)
    }

    public async create(item: ModelDTO<IDomain>, conn?: PoolClient): Promise<IDomain> {
        try {
            return await this.transactionWrap(async (conn) => {
                const insertQuery =
                    `
                    INSERT INTO domains (name, owner_id)
                    VALUES ($1, $2)
                    RETURNING id, name, owner_id as "ownerId"
            `
                const values = [item.name, item.ownerId]
                const result = await conn.query(insertQuery, values)
                if (result.rowCount === 0) {
                    throw new Error("Failed to create domain")
                }
                return result.rows[0]
            }, conn)
        } catch (error) {
            throw new Error("Failed to create domain: ", { cause: error })
        }
    }
    public async findById(id: string): Promise<IDomain | null> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                    SELECT id, name, owner_id as "ownerId"
                    FROM domains
                    WHERE id = $1 AND deleted_at IS NULL
                `
                const result = await conn.query(query, [id])
                if (result.rowCount === 0) {
                    return null
                }
                return result.rows[0]
            } catch (error) {
                throw new Error("Failed to find domain: ", { cause: error })
            }
        })
    }
    public async findByUserId(userId: string, limit: number = 100, offset: number = 0): Promise<IDomain[]> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT d.id, d.name, d.owner_id as "ownerId", d.created_at as "createdAt"
                FROM domains d
                INNER JOIN user_domains ud ON d.id = ud.domain_id
                WHERE ud.user_id = $1 AND d.deleted_at IS NULL AND ud.deleted_at IS NULL
                ORDER BY d.created_at DESC
                LIMIT $2 OFFSET $3
                `
                const result = await conn.query(query, [userId, limit, offset])
                return result.rows
            } catch (error) {
                throw new Error("Failed to find domains by user id: ", { cause: error })
            }
        })
    }
    public async update(id: string, patch: UpdatePatch<IDomain>): Promise<UpdateResult<IDomain>> {
        return this.transactionWrap(async (conn) => {
            try {
                const [setString, values] = await this.createSetValues(patch)
                const updateQuery = `
                    UPDATE domains
                    SET ${setString}
                    WHERE id = $1 AND deleted_at IS NULL
                    RETURNING id, name, owner_id as "ownerId"
                `
                const result = await conn.query(updateQuery, [id, ...values])
                if (result.rowCount === 0) {
                    return [null, new Error("Domain not found")]
                }
                return [result.rows[0], null]
            } catch (error) {
                throw new Error("Failed to update domain: ", { cause: error })
            }
        })
    }
    public async delete(id: string, externalConn?: PoolClient): Promise<void> {
        return this.transactionWrap(async (conn) => {
            try {
                const deleteQuery = `
                    UPDATE domains
                    SET deleted_at = NOW()
                    WHERE id = $1 AND deleted_at IS NULL
                `
                const result = await conn.query(deleteQuery, [id])
                if (result.rowCount === 0) {
                    throw new Error("Domain not found")
                }
            } catch (error) {
                throw new Error("Failed to delete domain: ", { cause: error })
            }
        }, externalConn)
    }

    public async deleteByOwnerId(ownerId: string, externalConn?: PoolClient): Promise<void> { // bulk deletion when owner is deleted - if the owner dosent want to delete the domain - they have to transfer ownership
        return this.transactionWrap(async (conn) => {
            try {
                const deleteQuery = `
                    UPDATE domains
                    SET deleted_at = NOW()
                    WHERE owner_id = $1 AND deleted_at IS NULL
                `
                await conn.query(deleteQuery, [ownerId])
            } catch (error) {
                throw new Error("Failed to delete domains by owner id: ", { cause: error })
            }
        }, externalConn)
    }
}

export const DomainModelInstance = new DomainModel(PostgresPool)