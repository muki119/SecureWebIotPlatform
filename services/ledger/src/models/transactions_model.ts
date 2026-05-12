import { BasePostgresModel, type ModelDTO, type ModelSchema } from "../../../common/types/models";
import { Pool, type PoolClient } from "pg"
import type { Result } from "../../../common/types/result";
import { PostgresPool } from "../config";
export type OpperationType = "CREATE" | "UPDATE" | "DELETE"
export interface ITransactionModel extends ModelSchema {
    deletedAt: never;
    initiatorId: string;
    opperationType: OpperationType;
    opperationTarget: string;
    targetId: string;
    value: Record<string, any> | null; // this will hold any additional information about the transaction that might be useful for auditing or debugging purposes - for example, if the transaction is about a user role update, we can store the new role in this field
    opperationTimestamp: Date;
    domainId: string;
}
export class TransactionModel extends BasePostgresModel<ITransactionModel> {
    protected updatableFieldsMap = new Map();
    constructor(db: Pool) {
        super(db)
    }

    public async create(item: ModelDTO<ITransactionModel>, externalConn?: PoolClient): Promise<Result<boolean>> {
        return this.transactionWrap(async (conn) => {
            try {
                const insertQuery = `
                INSERT INTO transactions (initiator_id, opperation_type, opperation_target, target_id, value, opperation_timestamp, domain_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `
                const values = [item.initiatorId, item.opperationType, item.opperationTarget, item.targetId, item.value, item.opperationTimestamp, item.domainId]
                await conn.query(insertQuery, values)
                return [true, null]
            } catch (error) {
                throw new Error("Failed to create transaction: ", { cause: error })
            }
        }, externalConn)
    }

    public async findByDomainId(domainId: string, dateFrom: Date, dateTo?: Date): Promise<Result<ITransactionModel[]>> { // date from is the starting point  - should always be earlier than date to 
        return this.poolWrap(async (conn) => {
            try {
                let query = `
                SELECT initiator_id AS "initiatorId", opperation_type AS "opperationType", opperation_target AS "opperationTarget", target_id AS "targetId", value, opperation_timestamp AS "opperationTimestamp", domain_id AS "domainId"
                FROM transactions 
                WHERE domain_id = $1 AND opperation_timestamp <= $2
            `
                const values: any[] = [domainId, dateFrom]
                if (dateTo) {
                    query += ` AND opperation_timestamp >= $3`
                    values.push(dateTo)
                }
                query += ` ORDER BY opperation_timestamp DESC LIMIT 100`
                const result = await conn.query(query, values)
                return [result.rows, null]
            } catch (error) {
                throw new Error("Failed to get transactions by domain id: ", { cause: error })
            }
        })
    }
}

export const TransactionModelInstance = new TransactionModel(PostgresPool)  