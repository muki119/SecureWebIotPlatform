import type { Schema } from "mongoose";
import type { ROLES } from "../constants";
import type { ModelSchema } from "./models";

export type Role = (typeof ROLES)[keyof typeof ROLES];
export interface IUserRole extends ModelSchema {
	userId: string | Schema.Types.UUID;
	domainId: string | Schema.Types.UUID;
	role: Role; // Makes sure roles are only the roles that were defined
}
