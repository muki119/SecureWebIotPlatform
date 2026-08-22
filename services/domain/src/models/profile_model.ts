import {
	type ModelDTO,
	type ModelSchema,
	PostgresDatabaseModel,
	type UpdatePatch,
	type UpdateResult,
} from "@services/common/types";
import type { PoolClient } from "pg";
import { PostgresPool } from "../config/postgres";
export interface IProfile extends ModelSchema {
	userId: string;
	email: string;
	name: string;
}
export class ProfileModel extends PostgresDatabaseModel<IProfile> {
	protected updatableFieldsMap = new Map<keyof ModelDTO<IProfile>, string>([
		["name", "string"], // only name can be updated in the profile , theres no need to update any other fields since theyre identifiers and metadata
		["email", "string"],
	]);
	public async create(item: ModelDTO<IProfile>): Promise<IProfile> {
		return this.transactionWrap(async (conn) => {
			try {
				const insertQuery = `
                INSERT INTO profiles (user_id, email, name)
                VALUES ($1, $2, $3)
                RETURNING user_id as "userId", email, name
            `;
				const values = [item.userId, item.email, item.name];
				const result = await conn.query(insertQuery, values);

				return result.rows[0];
			} catch (error) {
				throw new Error("Failed to create profile: ", { cause: error });
			}
		});
		// transactioned
	}
	public async findById(id: string): Promise<IProfile | null> {
		return this.poolWrap(async (conn) => {
			try {
				const query = `
                    SELECT user_id as "userId", email, name
                    FROM profiles
                    WHERE user_id = $1 AND deleted_at IS NULL   
                `;
				const values = [id];
				const result = await conn.query(query, values);
				if (result.rowCount === 0) {
					return null;
				}
				return result.rows[0];
			} catch (error) {
				throw new Error("Failed to find profile: ", { cause: error });
			}
		});
	}
	public async update(
		id: string,
		patch: UpdatePatch<IProfile>,
	): Promise<UpdateResult<IProfile>> {
		return this.transactionWrap(async (conn) => {
			try {
				const [setString, values] = await this.createSetValues(patch);
				const updateQuery = `
                    UPDATE profiles
                    SET ${setString}
                    WHERE user_id = $1 AND deleted_at IS NULL
                    RETURNING user_id as "userId", email, name
                `;
				const result = await conn.query(updateQuery, [id, ...values]);
				if (result.rowCount === 0) {
					return [
						null,
						new Error("User not found or no changes applied"),
					];
				}
				return [result.rows[0], null];
			} catch (error) {
				throw new Error("Failed to validate update patch: ", {
					cause: error,
				});
			}
		});
	}

	public async findByEmail(
		email: string,
		limit: number = 50,
	): Promise<IProfile[]> {
		return this.poolWrap(async (conn) => {
			try {
				const searchQuery = `
                    SELECT user_id as "userId", email, name
                    FROM profiles
                    WHERE email LIKE $1 || '%' AND deleted_at IS NULL
                    LIMIT $2
                `;
				const result = await conn.query(searchQuery, [email, limit]);
				if (result.rowCount === 0) {
					return [];
				}
				return result.rows;
			} catch (error) {
				throw new Error("Failed to find profile by email: ", {
					cause: error,
				});
			}
		});
	}
	public async delete(id: string, externalConn?: PoolClient): Promise<void> {
		return this.transactionWrap(async (conn) => {
			try {
				const deleteQuery = `
                    UPDATE profiles
                    SET deleted_at = NOW()
                    WHERE user_id = $1 AND deleted_at IS NULL
                `;
				await conn.query(deleteQuery, [id]);
			} catch (error) {
				throw new Error("Failed to delete profile: ", { cause: error });
			}
		}, externalConn);
	}
}

export const ProfileModelInstance = new ProfileModel(PostgresPool);
