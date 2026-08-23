import {
	type ModelDTO,
	type ModelSchema,
	PostgresAssociationModel,
} from "@services/common/types";
import type { PoolClient } from "pg";
import { PostgresPool } from "../config/postgres";

export interface IUserDomain extends ModelSchema {
	userId: string;
	domainId: string;
}

export class UserDomainModel extends PostgresAssociationModel<IUserDomain> {
	protected updatableFieldsMap = new Map<keyof ModelDTO<IUserDomain>, string>(
		[
			// no updatable fields since this is just a join table between users and domains
			// if more custom fields are added then here
		],
	);
	public async create(
		item: ModelDTO<IUserDomain>,
		externalConn?: PoolClient,
	): Promise<IUserDomain> {
		return this.transactionWrap(async (conn) => {
			try {
				const insertQuery = `
                INSERT INTO user_domains (user_id, domain_id)
                VALUES ($1, $2)
                RETURNING user_id as "userId", domain_id as "domainId"
            `;
				const values = [item.userId, item.domainId];
				const result = await conn.query(insertQuery, values);
				if (result.rowCount === 0) {
					throw new Error("Failed to create user domain association");
				}
				return result.rows[0];
			} catch (error) {
				throw new Error("Failed to create user domain association: ", {
					cause: error,
				});
			}
		}, externalConn);
	}
	public async delete(
		userId: string,
		domainId: string,
		externalConn?: PoolClient,
	): Promise<void> {
		// must be domain owner or user to delete association - checked in the service layer
		return this.transactionWrap(async (conn) => {
			try {
				const deleteQuery = `
                    UPDATE user_domains
                    SET deleted_at = NOW()
                    WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
                `;
				const values = [userId, domainId];
				const result = await conn.query(deleteQuery, values);
				if (result.rowCount === 0) {
					throw new Error("Failed to delete user domain association");
				}
			} catch (error) {
				throw new Error("Failed to delete user domain association: ", {
					cause: error,
				});
			}
		}, externalConn);
	}

	public async findAllByDomainId(
		domainId: string,
		limit: number = 100,
		offset: number = 0,
	): Promise<
		{
			userId: string;
			name: string;
			role: string;
			dateJoined: Date;
			email: string;
		}[]
	> {
		// will always return at least one since a domain needs an owner
		return this.poolWrap(async (conn) => {
			try {
				const query = ` 
                SELECT user_domains.user_id as "userId", profiles.name, user_roles.role, user_domains.created_at as "dateJoined", profiles.email
                FROM user_domains 
                INNER JOIN profiles ON user_domains.user_id = profiles.user_id
                INNER JOIN user_roles ON user_domains.user_id = user_roles.user_id AND user_domains.domain_id = user_roles.domain_id
                WHERE user_domains.domain_id = $1 AND user_domains.deleted_at IS NULL AND profiles.deleted_at IS NULL AND user_roles.deleted_at IS NULL
                ORDER BY user_domains.created_at DESC
                LIMIT $2 OFFSET $3
            `; // check for if the requester is in the domain will be done in the service layer - no need to find
				const values = [domainId, limit, offset];
				const result = await conn.query(query, values);
				return result.rows;
			} catch (error) {
				throw new Error("Failed to find user domain associations: ", {
					cause: error,
				});
			}
		});
	}

	public async isDomainMember(
		userId: string,
		domainId: string,
	): Promise<boolean> {
		return this.poolWrap(async (conn) => {
			if (!userId || !domainId) {
				throw new Error(
					"User ID and Domain ID are required to check domain membership",
				);
			}
			try {
				const query = `
                SELECT 1
                FROM user_domains
                WHERE user_id = $1 AND domain_id = $2 AND deleted_at IS NULL
            `;
				const values = [userId, domainId];
				const result = await conn.query(query, values);
				return Boolean(result.rowCount);
			} catch (error) {
				throw new Error("Failed to check if user is domain member: ", {
					cause: error,
				});
			}
		});
	}
}

export const UserDomainModelInstance = new UserDomainModel(PostgresPool);
