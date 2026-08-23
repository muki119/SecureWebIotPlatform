import { ROLE_PERMISSIONS, ROLES } from "@services/common/constants";
import type {
	IUserRole,
	ModelDTO,
	Result,
	Role,
	rolePermissions,
	UpdateResult,
} from "@services/common/types";
import { MongoAssociationModel } from "@services/common/types";
import type { ClientSession } from "mongoose";
import { MongoConnection } from "../config";
import UserRolesSchema from "../db/user_roles_schema";

export class UserRoleModel extends MongoAssociationModel<IUserRole> {
	protected updatableFieldMap = new Map<keyof ModelDTO<IUserRole>, string>([
		["role", "string"],
	]);
	async create(
		item: ModelDTO<IUserRole>,
		_externalSession?: ClientSession,
	): Promise<Result<IUserRole>> {
		try {
			const newRole = new this.model(item);
			await newRole.save();
			return [newRole.toObject(), null];
		} catch (error) {
			throw new Error("Error creating user role", { cause: error });
		}
	}

	async findByUserId(userId: string): Promise<IUserRole[]> {
		try {
			const userRoles = await this.model
				.find({ userId, deletedAt: null })
				.exec();
			return userRoles.map((role) => role.toObject());
		} catch (error) {
			throw new Error("Error finding user roles by user id", {
				cause: error,
			});
		}
	}

	async getDomainIdsByUserId(userId: string): Promise<string[]> {
		try {
			const userRoles = await this.model
				.find({ userId, deletedAt: null }, "domainId")
				.exec();
			return userRoles.map((role) => role.domainId as string);
		} catch (error) {
			throw new Error("Error finding user roles by user id", {
				cause: error,
			});
		}
	}

	async find(userId: string, domainId: string): Promise<IUserRole | null> {
		try {
			if (!domainId) {
				throw new Error("Domain ID is required to find user role");
			}
			const userRole = await this.model
				.findOne({ userId, domainId, deletedAt: null })
				.exec();
			return userRole ? userRole.toObject() : null;
		} catch (error) {
			throw new Error("Error finding user role by id", { cause: error });
		}
	}

	async isMember(userId: string, domainId: string): Promise<Result<boolean>> {
		try {
			const user = await this.model
				.exists({ userId, domainId, deletedAt: null })
				.exec();
			return [Boolean(user), null];
		} catch (error) {
			throw new Error("Error checking if user is member of domain", {
				cause: error,
			});
		}
	}

	async userPermisisons(
		userId: string,
		domainId: string,
	): Promise<Result<rolePermissions & { role: Role }>> {
		try {
			const userRole = await this.model
				.findOne({ userId, domainId, deletedAt: null }, "role")
				.exec(); // only gets the role
			if (!userRole) {
				return [
					null,
					new Error("User role not found for user in domain"),
				];
			}
			const rolePermissions = ROLE_PERMISSIONS[userRole.role];
			if (!rolePermissions) {
				return [null, new Error("Permissions not found for user role")];
			}
			return [{ role: userRole.role, ...rolePermissions }, null];
		} catch (error) {
			throw new Error("Error getting user permissions", { cause: error });
		}
	}

	async updateRole(
		userId: string,
		domainId: string,
		newRole: Role,
		_externalSession?: ClientSession,
	): Promise<UpdateResult<IUserRole>> {
		try {
			const isValidRole = newRole && newRole.toUpperCase() in ROLES;
			if (!isValidRole) {
				return [null, new Error("Invalid role provided")];
			}
			const updateObject = { role: newRole };
			const result = await this.model
				.findOneAndUpdate(
					{ userId, domainId, deletedAt: null },
					updateObject,
					{ returnDocument: "after" },
				)
				.exec();
			if (!result) {
				return [null, new Error("User role not found for update")];
			}
			return [result.toObject(), null];
		} catch (error) {
			throw new Error("Error updating user role", { cause: error });
		}
	}

	async delete(
		userId: string,
		domainId: string,
		_externalSession?: ClientSession,
	): Promise<Result<boolean>> {
		const result = await this.model
			.findOneAndUpdate(
				{ userId, domainId, deletedAt: null },
				{ deletedAt: new Date() },
			)
			.exec();
		if (!result) {
			return [null, new Error("User role not found for deletion")];
		}
		return [true, null];
	}
	async deleteByUserId(
		userId: string,
		_externalSession?: ClientSession,
	): Promise<Result<boolean>> {
		const result = await this.model
			.updateMany({ userId, deletedAt: null }, { deletedAt: new Date() })
			.exec();
		if (result.modifiedCount === 0) {
			return [null, new Error("No user roles found for deletion")];
		}
		return [true, null];
	}
}

export const UserRoleModelInstance = new UserRoleModel(
	MongoConnection,
	UserRolesSchema,
	"UserRoles",
);
