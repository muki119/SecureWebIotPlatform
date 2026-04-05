import { type Result } from "@services/common/types";
import { MongoConnection } from "../config";
import { Schema, type Connection, Model } from "mongoose";
import DeviceTelemetrySchema from "../db/device_telemetry_schema";
import { startOfISOWeek, endOfISOWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"
import { type DeviceTelemetry, CapabilityTypes, Intervals, IntervalUnits } from "../types";



// could potentially move this as a sidecar binary
export class DeviceTelemetryModel { // extends nothing because telemetry is only written and read (paginated)- dosent conform to usual crud since its just logs basicallys
    private conn: Connection
    private model: Model<DeviceTelemetry>
    constructor(conn: Connection, schema: Schema, modelName: string) {
        this.conn = conn
        this.model = this.conn.model<DeviceTelemetry>(modelName, schema)
    }

    async create(deviceId: string, capability: string, value: string | number | boolean): Promise<void> {
        try {
            if (typeof capability !== "string" || typeof deviceId !== "string") {
                throw new Error("Invalid input types for deviceId or capability")
            }
            if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
                throw new Error("Invalid input type for value")
            }
            this.model.create({ // not transactional because need telemetry to be quickly written
                metadata: {
                    deviceId,
                    capability
                },
                value
            })
        } catch (error) {
            throw new Error("Failed to create device telemetry", { cause: error })
        }
    }

    private getIntervalBounds(queryDate: Date, interval: Intervals): [Date, Date] {
        switch (interval) {
            case Intervals.DAY:
                return [startOfDay(queryDate), endOfDay(queryDate)]
            case Intervals.WEEK:
                return [startOfISOWeek(queryDate), endOfISOWeek(queryDate)]
            case Intervals.MONTH:
                return [startOfMonth(queryDate), endOfMonth(queryDate)]
            default:
                throw new Error("Invalid interval")
        }
    }

    isNumericCapability(capabilityType: CapabilityTypes): boolean {
        return capabilityType === CapabilityTypes.RANGE || capabilityType === CapabilityTypes.GUAGE
    }

    async findByDeviceId(deviceId: string, capability: string, capabilityType: CapabilityTypes, queryDate: Date | null = null, interval = Intervals.WEEK): Promise<Result<DeviceTelemetry[]>> { // will be paginated by week or day
        try {
            const [lowerBound, upperBound] = this.getIntervalBounds(queryDate || new Date(), interval) // by doing this , dont need frontend to manually specify date bounds
            const isNumeric = this.isNumericCapability(capabilityType) // if the capability is a numeric type

            const match: any = { // the match for the aggregation pipeline
                "metadata.deviceId": deviceId,
                timestamp: { $gte: lowerBound, $lte: upperBound },
                "metadata.capability": capability
            }

            const groupBy: any = {
                _id: {
                    $dateTrunc: {
                        date: "$timestamp",
                        unit: IntervalUnits[interval]
                    }
                }// group by the the timestamps being in the same interval
            }

            let accumulator = isNumeric ?
                { avg: { $avg: "$value" }, min: { $min: "$value" }, max: { $max: "$value" } } // if its a numeric type then get the regular stats for each interval
                : { last: { $last: "$value" } }// if its non numeric (categorical) then get the last value in the interval

            const results = await this.model.aggregate([ // should get all data within time frame for a capability of a device
                { $match: match },
                { $sort: { timestamp: 1 } }, // sort by timestamp in ascending order so that the grouping gets the right values for last and avg
                { $group: { ...groupBy, ...accumulator } },
                { $sort: { "_id": 1 } } // sort by the interval time in ascending order
            ]).exec()


            return [results as DeviceTelemetry[], null]
        } catch (error) {
            throw new Error("Failed to find device telemetry", { cause: error })
        }
    }
}

export const DeviceTelemetryModelInstance = new DeviceTelemetryModel(MongoConnection, DeviceTelemetrySchema, "DeviceTelemetry")