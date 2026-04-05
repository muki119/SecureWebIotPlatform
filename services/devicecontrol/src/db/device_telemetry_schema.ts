import { Schema } from "mongoose";
import type { DeviceTelemetry } from "../types";



const TELEMETRY_EXPIRATION_SECONDS = (60 * 60 * 24 * 7 * 4) // 1 month

const DeviceTelemetrySchema = new Schema<DeviceTelemetry>({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    metadata: {
        deviceId: {
            type: Schema.Types.UUID,
            required: true,
        },
        capability: {
            type: String,
            required: true,
        },
    },

    value: {
        type: Schema.Types.Mixed,
        required: true,
    }
}, {
    timestamps: false,
    timeseries: {
        timeField: "timestamp",
        metaField: "metadata",
        granularity: "seconds" // doesnt go any finer than seconds 
    },
    expireAfterSeconds: TELEMETRY_EXPIRATION_SECONDS,
})

DeviceTelemetrySchema.index({ "metadata.deviceId": 1, "metadata.capability": 1, timestamp: -1 }) // timestammp in desc so queries for recent is faster
export default DeviceTelemetrySchema