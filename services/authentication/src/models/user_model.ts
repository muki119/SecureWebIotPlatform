import type { ModelSchema, UpdatePatch, ModelDTO, UpdateResult } from "../types/models";
import { PostgresDatabaseModel } from "../types/models"
import { Pool, type PoolClient } from "pg";
import { PostgresPool } from "../config/postgres";


export interface User extends ModelSchema { // this application wont utilise a username field i think , should probably be email instead
    id: string,
    forename: string,
    surname: string,
    email: string,
    password: string,
    createdAt: Date,
    deletedAt: Date | null
}
export default class UserModel extends PostgresDatabaseModel<User> {

    constructor(db: Pool) {
        super(db)
    }

    private fieldsMap = new Map<keyof ModelDTO<User>, string>([
        ["email", "string"],
        ["forename", "string"],
        ["surname", "string"],
        ["password", "string"]
    ]) // the fields and their corresponding expected data types - for validation in updates 

    public async create(item: ModelDTO<User>): Promise<User> {
        // item should be pre- validated and sanitised - either way the database should have contraints to prevent too much bad
        // like max chars 

        return this.poolWrap(async (conn) => {
            try {
                const beginTransaction = await conn.query("BEGIN") // begin a transaction - acid
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const insertQuery = `
                INSERT INTO users (email, password, forename,surname)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, forename, surname, created_at
            `
                const values = [item.email, item.password, item.forename, item.surname]
                const result = await conn.query(insertQuery, values)
                const commitTransaction = await conn.query("COMMIT") // commit the transaction
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                return result.rows[0]
            } catch (err) {
                conn.query("ROLLBACK") // if there was an error, roll back the transaction
                throw new Error("Failed to create user: ", { cause: err })
            }
        })
    }
    public async findById(id: string): Promise<User | null> {

        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT id, email, forename, surname,password, created_at
                FROM users
                WHERE id = $1 AND deleted_at IS NULL
            `
                const result = await conn.query(query, [id])
                return result.rows[0] || null
            } catch (err) {
                throw new Error("Failed to find user by id: ", { cause: err })
            }
        })
    }

    public async findByIdWithoutPassword(id: string): Promise<Omit<User, "password"> | null> { // same as find by id but without the password field for security reasons
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT id, email, forename, surname, created_at
                FROM users
                WHERE id = $1 AND deleted_at IS NULL
            `
                const result = await conn.query(query, [id])
                return result.rows[0] || null
            } catch (err) {
                throw new Error("Failed to find user by id: ", { cause: err })
            }
        })
    }
    public async update(id: string, patch: UpdatePatch<User>): Promise<UpdateResult<User>> {
        // go through each change in the patch and build a query to update the record with all the changes
        return this.poolWrap(async (conn) => {
            try {
                var setStringArr: string[] = []
                var seenSet = new Set<keyof ModelDTO<User>>()
                for (let i = 0; i < patch.length; i++) {
                    const change = patch[i]!
                    if (!this.fieldsMap.has(change.field)) {
                        return { success: false, message: `Invalid field ${change.field} in update patch` }// if not in the allowed fields then return unsuccessful result - its not bad enough to warrant a thrown error
                    }
                    if (seenSet.has(change.field)) {
                        return { success: false, message: `Duplicate field ${change.field} in update patch` }
                    }
                    if (typeof change.value !== this.fieldsMap.get(change.field)) {
                        return { success: false, message: `Invalid data type for field ${change.field}: expected ${this.fieldsMap.get(change.field)}, got ${typeof change.value}` }
                    }
                    seenSet.add(change.field)
                    setStringArr.push(`${change.field} = $${i + 2}`)
                }// build the set string for the update query - starts at $2 because $1 is the id in the where clause
                const setString = setStringArr.join(", ")
                const values = patch.map(change => change.value) // get the values for the update query
                const beginTransaction = await conn.query("BEGIN") // begin a transaction - acid
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                const query = `
                UPDATE users
                SET ${setString}
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING id, email, forename, surname, created_at
            `
                const result = await conn.query(query, [id, ...values])
                const commitTransaction = await conn.query("COMMIT") // commit the transaction
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
                if (result.rowCount === 0) {
                    return { success: false, message: "User not found or no changes applied" }
                }
                return { success: true, updatedItem: result.rows[0] }
            } catch (err) {
                conn.query("ROLLBACK")
                throw new Error("Failed to update user: ", { cause: err })
            }
        })
    }
    public async delete(id: string): Promise<void> { // soft delete by setting deletedAt field to current timestamp
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                UPDATE users
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
            `
                const beginTransaction = await conn.query("BEGIN") // begin a transaction - acid
                if (beginTransaction.command !== "BEGIN") {
                    throw new Error("Failed to begin transaction")
                }
                await conn.query(query, [id])
                const commitTransaction = await conn.query("COMMIT") // commit the transaction
                if (commitTransaction.command !== "COMMIT") {
                    throw new Error("Failed to commit transaction")
                }
            } catch (err) {
                conn.query("ROLLBACK")
                throw new Error("Failed to delete user: ", { cause: err })
            }
        })
    }
    public async findByEmail(email: string): Promise<User | null> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT id, email, forename, surname, created_at, password
                FROM users
                WHERE email = $1 AND deleted_at IS NULL
            `
                const result = await conn.query(query, [email])
                return result.rows[0] || null
            } catch (err) {
                throw new Error("Failed to find user by email: ", { cause: err })
            }
        })
    }
    public async existsById(id: string): Promise<boolean> {

        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT 1
                FROM users
                WHERE id = $1 AND deleted_at IS NULL
            `
                const result = await conn.query(query, [id])
                return Boolean(result.rowCount) // if row count isnt null or 0 then it exists
            } catch (err) {
                throw new Error("Failed to check if user exists by id: ", { cause: err })
            }
        })
    }
    public async existsByEmail(email: string): Promise<boolean> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                    SELECT 1
                    FROM users
                    WHERE email = $1 AND deleted_at IS NULL
                `
                const result = await conn.query(query, [email])
                return Boolean(result.rowCount) // if row count isnt null or 0 then it exists
            } catch (err) {
                throw new Error("Failed to check if user exists by email: ", { cause: err })
            }
        })
    }

    protected poolWrap: <U>(operation: (conn: PoolClient) => Promise<U>) => Promise<U> = (operation) => {
        return new Promise(async (fufilled, reject) => {
            const conn = await this.db.connect() // gets a connection from the pool
            try {
                const result = await operation(conn) // performs the opperation with the connection
                fufilled(result) // if success then fufill the promise with the result
            } catch (err) {
                reject(err) // otherwise reject with the error
            } finally {
                conn.release()
            }
        })
    }

}
export const userModel = new UserModel(PostgresPool)