import { Schema } from "mongoose";
import { randomUUID } from 'crypto';


const UserRolesSchema = new Schema({
    _id: {
        type: Schema.Types.UUID,
        default: randomUUID,
        alias: "id"
    },
    userId: {
        type: Schema.Types.UUID,
        required: true,
    },
    domainId: {
        type: Schema.Types.UUID,
        required: true,
    },
    deletedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: {
        createdAt: "createdAt", // explicit for safety
        updatedAt: "updatedAt"
    },
    toObject: { // to allow id virtual / alias to be included when turniing into object
        virtuals: true,
    },
    toJSON: { // same as to obect but for json
        virtuals: true,
    }
})

UserRolesSchema.index({ userId: 1, domainId: 1, deletedAt: 1 })

export default UserRolesSchema

