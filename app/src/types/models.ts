export type OpperationType = "CREATE" | "UPDATE" | "DELETE"
export interface ITransactionModel {
    id: string;
    createdAt: Date;
    initiatorId: string;
    opperationType: OpperationType;
    opperationTarget: string;
    targetId: string;
    value: Record<string, unknown> | null; // this will hold any additional information about the transaction that might be useful for auditing or debugging purposes - for example, if the transaction is about a user role update, we can store the new role in this field
    opperationTimestamp: Date;
    domainId: string;
}