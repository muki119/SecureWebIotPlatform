import { Schema } from "mongoose";
import { CapabilityTypes } from "../models"
import type { IDevice, CurrentDeviceState, DeviceCapabilities } from "../models"
import type { MongoModelSchema } from "@services/common/types";
import { randomUUID } from 'crypto';



export const DeviceCurrentStateSchema = new Schema<CurrentDeviceState>({
    value: Schema.Types.Mixed, // can be a string, number, boolean, or date - depending on the capability type
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false, timestamps: false })
export const DeviceCapabilitiesSchema = new Schema<DeviceCapabilities>({
    Label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(CapabilityTypes),
        required: true
    },
    metric: { // unit's of measurement - could enum it with common units 
        type: String,
        required: true
    },
    min: { // for range types
        type: Number
    },
    max: { // for range types
        type: Number
    },
    enumValues: { // for enums types
        type: [String]
    }
}, {
    _id: false, timestamps: false
})

const DeviceSchema = new Schema<MongoModelSchema<IDevice>>({
    _id: {
        type: Schema.Types.UUID,
        default: randomUUID,
        alias: "id"
    },
    name: {
        type: String,
        required: true
    },
    domainId: {
        type: Schema.Types.UUID,
        required: true,
        index: true,
        immutable: true
    },
    createdBy: {
        type: Schema.Types.UUID,
        required: true,
        immutable: true
    },
    currentState: {
        type: Map,
        of: DeviceCurrentStateSchema,
        required: true
    },
    capabilities: {
        type: Map,
        of: DeviceCapabilitiesSchema,
        required: true
    },
    deletedAt: {
        type: Date,
        default: null
    },

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

DeviceSchema.index({ domainId: 1, deletedAt: 1 })

export default DeviceSchema