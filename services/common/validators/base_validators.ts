import type { ParamSchema, Schema } from "express-validator";
import { checkSchema } from "express-validator";

export const DomainConstraints: Schema = {
	domainId: {
		in: "params",
		isString: true,
		isUUID: { options: 7 },
		notEmpty: true,
		errorMessage: "Domain ID is required",
	},
};

export const UserIdConstraint: ParamSchema = {
	isString: true,
	isUUID: { options: 7 },
	notEmpty: true,
	errorMessage: "User ID is required",
};

export const DomainIdOnlyValidator = checkSchema(DomainConstraints);
