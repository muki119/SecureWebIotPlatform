import type { IUserRole, ModelDTO, UpdateResult, Result, Role, rolePermissions } from "@services/common/types"
import { MongoAssociationModel } from "@services/common/types";
import { ROLES, ROLE_PERMISSIONS } from "@services/common/constants";
import { Schema, Connection, type ClientSession } from "mongoose";

export default class UserRoleModel extends MongoAssociationModel<IUserRole> {

    protected updatableFieldMap = new Map<keyof ModelDTO<IUserRole>, string>([
        ["role", "string"]
    ])
    constructor(db: Connection, schema: Schema<IUserRole>, modelName: string) {
        super(db, schema, modelName)
    }
    async create(item: ModelDTO<IUserRole>, externalSession?: ClientSession): Promise<Result<IUserRole>> {
        return await this.transactionWrap(async (session) => {
            try {
                const newRole = new this.model(item)
                await newRole.save({ session })
                return [newRole, null]
            } catch (error) {
                throw new Error("Error creating user role", { cause: error })
            }
        }, externalSession)
    }

    async findById(id: string, domainId?: string): Promise<IUserRole | null> {
        try {
            if (!domainId) {
                throw new Error("Domain ID is required to find user role")
            }
            const userRole = await this.model.findOne({ _id: id, domainId, deletedAt: null }).exec()
            return userRole
        } catch (error) {
            throw new Error("Error finding user role by id", { cause: error })
        }
    }
    async userPermisisons(userId: string, domainId: string): Promise<Result<rolePermissions & { role: Role }>> {
        try {
            const userRole = await this.model.findOne({ userId, domainId, deletedAt: null }, "role").exec() // only gets the role
            if (!userRole) {
                return [null, new Error("User role not found for user in domain")]
            }
            const rolePermissions = ROLE_PERMISSIONS[userRole.role]
            if (!rolePermissions) {
                return [null, new Error("Permissions not found for user role")]
            }
            return [{ role: userRole.role, ...rolePermissions }, null]

        } catch (error) {
            throw new Error("Error getting user permissions", { cause: error })
        }
    }

    async updateRole(userId: string, domainId: string, newRole: Role, externalSession?: ClientSession): Promise<UpdateResult<IUserRole>> {
        return await this.transactionWrap(async (session) => {
            try {
                const isValidRole = (newRole) && newRole.toUpperCase() in ROLES
                if (!isValidRole) {
                    return [null, new Error("Invalid role provided")]
                }
                const updateObject = { role: newRole }
                const result = await this.model.findOneAndUpdate({ userId, domainId, deletedAt: null }, updateObject, { session, returnDocument: "after" }).exec()
                if (!result) {
                    return [null, new Error("User role not found for update")]
                }
                return [result, null]
            } catch (error) {
                throw new Error("Error updating user role", { cause: error })
            }
        }, externalSession)
    }

    async delete(userId: string, domainId: string, externalSession?: ClientSession): Promise<Result<boolean>> {
        return await this.transactionWrap(async (session) => {
            const result = await this.model.findOneAndUpdate({ userId, domainId, deletedAt: null }, { deletedAt: new Date() }, { session }).exec()
            if (!result) {
                return [null, new Error("User role not found for deletion")]
            }
            return [true, null]
        }, externalSession)
    }

}