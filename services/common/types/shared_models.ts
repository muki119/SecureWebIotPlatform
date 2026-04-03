import type { ModelSchema } from "./models";

export interface IUserRole extends ModelSchema {
    userId: string,
    domainId: string,
    role: string,
}