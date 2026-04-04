import { Schema } from "mongoose";
import type { DeviceTelemetry } from "../types";



const TELEMETRYEXPIRATIONSECONDS = (60 * 60 * 24 * 7 * 2) // 2 weeks  - might create an aggregator that crunches old data into daily averages

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
    expireAfterSeconds: TELEMETRYEXPIRATIONSECONDS,
})

DeviceTelemetrySchema.index({ "metadata.deviceId": 1, "metadata.capability": 1, timestamp: -1 }) // timestammp in desc so queries for recent is faster
export default DeviceTelemetrySchema