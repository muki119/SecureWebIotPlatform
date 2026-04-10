import type { ModelSchema } from "./models";
import { ROLES } from "../constants"
import type { Schema } from "mongoose";


export type Role = typeof ROLES[keyof typeof ROLES]
export interface IUserRole extends ModelSchema {
    userId: string | Schema.Types.UUID,
    domainId: string | Schema.Types.UUID,
    role: Role, // Makes sure roles are only the roles that were defined
}