import { randomUUID } from "node:crypto";
import { ROLES } from "@services/common/constants";
import { Schema } from "mongoose";

const UserRolesSchema = new Schema(
	{
		_id: {
			type: Schema.Types.UUID,
			default: randomUUID,
			alias: "id",
		},
		userId: {
			type: Schema.Types.UUID,
			required: true,
		},
		role: {
			type: String,
			required: true,
			enum: Object.values(ROLES), // Makes sure roles are only the roles that were defined
		},
		domainId: {
			type: Schema.Types.UUID,
			required: true,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: {
			createdAt: "createdAt", // explicit for safety
			updatedAt: "updatedAt",
		},
		toObject: {
			// to allow id virtual / alias to be included when turniing into object
			virtuals: true,
		},
		toJSON: {
			// same as to obect but for json
			virtuals: true,
		},
	},
);

UserRolesSchema.index(
	{ userId: 1, domainId: 1 },
	{ partialFilterExpression: { deletedAt: null }, unique: true },
);
UserRolesSchema.set("toObject", { virtuals: true });

export default UserRolesSchema;
