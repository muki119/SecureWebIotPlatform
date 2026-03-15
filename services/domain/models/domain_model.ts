import { PostgresDatabaseModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool } from "pg"

export interface IDomain extends ModelSchema {
    id: string,
    name: string,
    ownerId: string,
}

export class DomainModel extends PostgresDatabaseModel<IDomain> {

    protected fieldsMap = new Map<keyof ModelDTO<IDomain>, string>([
        ["name", "string"],
    ])
    constructor(db: Pool) {
        super(db)
    }
    public async create(item: ModelDTO<IDomain>): Promise<IDomain> {
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const insertQuery = `
                INSERT INTO domains (name, owner_id)
                VALUES ($1, $2)
                RETURNING id, name, owner_id as ownerId
            `
                const values = [item.name, item.ownerId]
                const result = await conn.query(insertQuery, values)
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                return result.rows[0]
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to create domain: ", { cause: error })
            }
        })
    }
    public async findById(id: string): Promise<IDomain | null> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                    SELECT id, name, owner_id as ownerId
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
    public async update(id: string, patch: UpdatePatch<IDomain>): Promise<UpdateResult<IDomain>> {
        return this.poolWrap(async (conn) => {
            try {
                const [setString, values] = await this.createSetValues(patch)
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const updateQuery = `
                    UPDATE domains
                    SET ${setString}
                    WHERE id = $1 AND deleted_at IS NULL
                    RETURNING id, name, owner_id as ownerId
                `
                const result = await conn.query(updateQuery, [id, ...values])
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                if (result.rowCount === 0) {
                    throw new Error("Domain not found")
                }
                return result.rows[0]
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to update domain: ", { cause: error })
            }
        })
    }
    public async delete(id: string): Promise<void> {
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const deleteQuery = `
                    UPDATE domains
                    SET deleted_at = NOW()
                    WHERE id = $1 AND deleted_at IS NULL
                `
                const result = await conn.query(deleteQuery, [id])
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                if (result.rowCount === 0) {
                    throw new Error("Domain not found")
                }
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to delete domain: ", { cause: error })
            }
        })
    }
}