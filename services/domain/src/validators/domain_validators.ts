import { ROLES } from "@services/common/constants";
import {
	DomainConstraints,
	UserIdConstraint,
} from "@services/common/validators";
import { checkSchema } from "express-validator";
export const AddUserValidator = checkSchema({
	...DomainConstraints,
	id: {
		...UserIdConstraint,
		in: "body",
	},
	role: {
		in: "body",
		isString: true,
		isIn: {
			options: Object.values(ROLES),
		},
		notEmpty: true,
		errorMessage:
			"Role is required and must be one of owner, admin, or user",
	},
});

export const CreateDomainValidator = checkSchema({
	name: {
		in: "body",
		isString: true,
		trim: true,
		notEmpty: true,
		escape: true,
		errorMessage: "Domain name is required",
	},
});

export const UpdateOwnerValidator = checkSchema({
	...DomainConstraints,
	newOwnerId: {
		...UserIdConstraint,
		in: "body",
	},
});

export const DeleteUserValidator = checkSchema({
	...DomainConstraints,
	userToDelete: {
		...UserIdConstraint,
		in: "params",
	},
});

export const UpdateUserRoleValidator = checkSchema({
	...DomainConstraints,
	userToUpdate: {
		...UserIdConstraint,
		in: "params",
	},
	role: {
		in: "body",
		isString: true,
		isIn: {
			options: Object.values(ROLES),
		},
		notEmpty: true,
		errorMessage:
			"Role is required and must be one of owner, admin, or user",
	},
});
