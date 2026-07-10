import type { ROLES } from "@/constants/role_permissions";

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

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type User = {
    userId: string;
    role: Role;
    [key: string]: unknown;
};

export type Domain = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
    role: Role;
    users: Record<string, User>;
    [key: string]: unknown;
};

export type Domains = Record<string, Domain>;

export type DomainDevices = Record<
    string,
    Record<
        string,
        {
            id: string;
            name: string;
            domainId: string;
            currentState: Record<string, { value: unknown; timestamp: number }>;
            online: boolean;
            [key: string]: unknown;
        }
    >
>