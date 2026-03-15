import { PostgresDatabaseModel, type ModelDTO, type ModelSchema, type UpdatePatch, type UpdateResult } from "@services/common/types"
import { Pool } from "pg"

export interface IProfile extends ModelSchema {
    userId: string,
    name: string,
}
export class ProfileModel extends PostgresDatabaseModel<IProfile> {

    protected fieldsMap = new Map<keyof ModelDTO<IProfile>, string>([
        ["name", "string"], // only name can be updated in the profile , theres no need to update any other fields since theyre identifiers and metadata
    ])
    constructor(db: Pool) {
        super(db)
    }
    public async create(item: ModelDTO<IProfile>): Promise<IProfile> {
        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const insertQuery = `
                INSERT INTO profiles (user_id, name)
                VALUES ($1, $2)
                RETURNING user_id as userId, name
            `
                const values = [item.userId, item.name]
                const result = await conn.query(insertQuery, values)
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                return result.rows[0]
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to create profile: ", { cause: error })
            }
        })
        // transactioned
    }
    public async findById(id: string): Promise<IProfile | null> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                    SELECT user_id as userId, name
                    FROM profiles
                    WHERE user_id = $1 AND deleted_at IS NULL   
                `
                const values = [id]
                const result = await conn.query(query, values)
                if (result.rowCount === 0) {
                    return null
                }
                return result.rows[0]
            } catch (error) {
                throw new Error("Failed to find profile: ", { cause: error })
            }
        })
    }
    public async update(id: string, patch: UpdatePatch<IProfile>): Promise<UpdateResult<IProfile>> {
        return this.poolWrap(async (conn) => {
            try {
                const [setString, values] = await this.createSetValues(patch)
                const beginTransaction = await conn.query("BEGIN")
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const updateQuery = `
                    UPDATE profiles
                    SET ${setString}
                    WHERE user_id = $1 AND deleted_at IS NULL
                    RETURNING user_id as userId, name
                `
                const result = await conn.query(updateQuery, [id, ...values])
                if (result.rowCount === 0) {
                    return { success: false, message: "User not found or no changes applied" }
                }
                return { success: true, data: result.rows[0] }
            } catch (error) {
                throw new Error("Failed to validate update patch: ", { cause: error })
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
                    UPDATE profiles
                    SET deleted_at = NOW()
                    WHERE user_id = $1 AND deleted_at IS NULL
                `
                await conn.query(deleteQuery, [id])
                const commitTransaction = await conn.query("COMMIT")
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
            } catch (error) {
                await conn.query("ROLLBACK")
                throw new Error("Failed to delete profile: ", { cause: error })
            }
        })
    }

}