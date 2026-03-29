import type { ModelSchema, UpdatePatch, ModelDTO, UpdateResult } from "@services/common/types";
import { PostgresDatabaseModel } from "@services/common/types";
import { Pool, type PoolClient } from "pg";
import { PostgresPool } from "../config/postgres";


export interface IUser extends ModelSchema { // this application wont utilise a username field i think , should probably be email instead
    id: string,
    forename: string,
    surname: string,
    email: string,
    password: string,
    createdAt: Date,
    deletedAt: Date | null
}
export default class UserModel extends PostgresDatabaseModel<IUser> {

    constructor(db: Pool) {
        super(db)
    }

    protected fieldsMap = new Map<keyof ModelDTO<IUser>, string>([
        ["email", "string"],
        ["forename", "string"],
        ["surname", "string"],
        ["password", "string"]
    ]) // the fields and their corresponding expected data types - for validation in updates 

    public async create(item: ModelDTO<IUser>, externalConn?: PoolClient): Promise<IUser> {
        // item should be pre- validated and sanitised - either way the database should have contraints to prevent too much bad
        // like max chars 

        return this.transactionWrap(async (conn) => {
            try {
                const insertQuery = `
                INSERT INTO users (email, password, forename,surname)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, forename, surname, created_at as "createdAt"
            `
                const values = [item.email, item.password, item.forename, item.surname]
                const result = await conn.query(insertQuery, values)
                return result.rows[0]
            } catch (err) {
                throw new Error("Failed to create user: ", { cause: err })
            }
        }, externalConn)
    }
    public async findById(id: string): Promise<IUser | null> {

        return this.poolWrap(async (conn) => {
            try {
                const query = `
                    SELECT id, email, forename, surname,password, created_at as "createdAt"
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

    public async findByIdWithoutPassword(id: string): Promise<Omit<IUser, "password"> | null> { // same as find by id but without the password field for security reasons
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT id, email, forename, surname, created_at as "createdAt"
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
    public async update(id: string, patch: UpdatePatch<IUser>): Promise<UpdateResult<IUser>> {
        // go through each change in the patch and build a query to update the record with all the changes
        return this.transactionWrap(async (conn) => {
            try {
                const [setString, values] = await this.createSetValues(patch)
                const query = `
                UPDATE users
                SET ${setString}
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING id, email, forename, surname, created_at as "createdAt"
            `
                const result = await conn.query(query, [id, ...values])
                if (result.rowCount === 0) {
                    return [null, new Error("User not found or no changes applied")]
                }
                return [result.rows[0], null]
            } catch (err) {
                throw new Error("Failed to update user: ", { cause: err })
            }
        })
    }
    public async delete(id: string): Promise<void> { // soft delete by setting deletedAt field to current timestamp
        return this.transactionWrap(async (conn) => {
            try {
                const query = `
                UPDATE users
                SET deleted_at = NOW()
                WHERE id = $1 AND deleted_at IS NULL
            `
                await conn.query(query, [id])
            } catch (err) {
                throw new Error("Failed to delete user: ", { cause: err })
            }
        })
    }
    public async findByEmail(email: string): Promise<IUser | null> {
        return this.poolWrap(async (conn) => {
            try {
                const query = `
                SELECT id, email, forename, surname, created_at as "createdAt", password
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

}
export const userModel = new UserModel(PostgresPool)