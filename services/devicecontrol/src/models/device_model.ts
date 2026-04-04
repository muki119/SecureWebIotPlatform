import DeviceSchema from "../db/device_schema.ts"
import type { IDevice, DeviceCapabilities, CurrentDeviceState } from "../types"
import { CapabilityTypes } from "../types"
import { MongoDatabaseModel, type ModelDTO, type MongoModelSchema, type UpdatePatch, type UpdateResult, type Result } from "@services/common/types"
import { MongoConnection } from "../config"
import { Schema, Connection, Model, type ClientSession } from "mongoose";


export class DeviceModel extends MongoDatabaseModel<IDevice> {
    constructor(db: Connection, schema: Schema<IDevice>, modelName: string) {
        super(db, schema, modelName)
    }

    protected updatableFieldMap = new Map<keyof ModelDTO<IDevice>, string>([
        ["name", "string"]
    ])

    async createCurrentStateMap(capabilities: Map<string, DeviceCapabilities>): Promise<Map<string, CurrentDeviceState>> { // makes current state from capabilities
        try {
            const currentState = new Map<string, CurrentDeviceState>()
            capabilities.forEach((capability, key) => {
                let initialValue: string | number | boolean
                switch (capability.type) {
                    case "BINARY":
                        initialValue = false
                        break
                    case "RANGE":
                        initialValue = capability.min ?? 0
                        break
                    case "GAUGE":
                        initialValue = 0
                        break
                    case "ENUM":
                        initialValue = capability.enumValues ? capability.enumValues[0]! : ""
                        break
                    case "COLOR":
                        initialValue = "#000000"
                        break
                    default:
                        throw new Error(`Unsupported capability type: ${capability.type}`)
                }
                currentState.set(key, { value: initialValue, timestamp: new Date() })
            })
            return currentState

        } catch (error) {
            throw new Error("Error creating current state map", { cause: error })
        }
    }

    async verifyCapabilities(capabilities: Map<string, DeviceCapabilities>): Promise<[Error] | [null]> {
        try {
            capabilities.forEach((capability, key) => {
                if (!capability.Label || typeof capability.Label !== "string") {
                    return [new Error(`Capability ${key} is missing a valid Label`)]
                }
                if (!capability.type || typeof capability.type !== "string" || !Object.values(CapabilityTypes).includes(capability.type)) {
                    return [new Error(`Capability ${key} has an invalid type`)]
                }
                if (!capability.metric || typeof capability.metric !== "string") {
                    return [new Error(`Capability ${key} is missing a valid metric`)]
                }
                switch (capability.type) {
                    case "RANGE":
                        if (typeof capability.min !== "number" || typeof capability.max !== "number") {
                            return [new Error(`Capability ${key} of type RANGE must have min and max values that are numbers`)]
                        }
                        if (capability.min >= capability.max) {
                            return [new Error(`Capability ${key} of type RANGE must have min value less than max value`)]
                        }
                        break
                    case "ENUM":
                        if (!capability.enumValues || !Array.isArray(capability.enumValues) || capability.enumValues.some(ev => typeof ev !== "string")) {
                            return [new Error(`Capability ${key} of type ENUM must have an array of string enumValues`)]
                        }
                        break
                    case "BINARY":
                    case "GAUGE":
                    case "COLOR":
                        break
                    default:
                        return [new Error(`Unsupported capability type: ${capability.type}`)]
                }
            })
            return [null]
        } catch (error) {
            throw new Error("Error verifying capabilities", { cause: error })
        }
    }

    async delete(id: string, externalSession?: ClientSession): Promise<Result<boolean>> {
        return await this.transactionWrap(async (session) => {
            try {
                const deleted = await this.model.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { session }).exec()
                if (!deleted) {
                    return [null, new Error("Device not found")]
                }
                return [true, null]
            } catch (error) {
                throw new Error("Error deleting device", { cause: error })
            }
        }, externalSession)
    }

    verifyCapabilityValue(capabilityType: CapabilityTypes, value: string | number | boolean, capabilityDetails: DeviceCapabilities): boolean {
        switch (capabilityType) {
            case "BINARY":
                return typeof value === "boolean"
            case "RANGE":
                return typeof value === "number" && value >= (capabilityDetails.min ?? Number.MIN_VALUE) && value <= (capabilityDetails.max ?? Number.MAX_VALUE)
            case "GAUGE":
                return typeof value === "number"
            case "ENUM":
                return typeof value === "string" && capabilityDetails.enumValues?.includes(value) === true
            case "COLOR":
                return typeof value === "string" && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(value) // test if its a valid hex colour - could also adding support for rgb/hsl and whatnot
            default:
                return false
        }
    }


    async findAllByDomainId(domainId: string): Promise<Result<IDevice[]>> {
        try {
            if (!domainId || typeof domainId !== "string") {
                return [null, new Error("Invalid domain id")]
            }
            const devices = await this.model.find({ domainId, deletedAt: null }).exec()
            return [devices, null]
        } catch (error) {
            throw new Error("Error attempting to find all devices under domain id ", { cause: error })
        }
    }

    async updateCurrentState(id: string, capabilityKey: string, newValue: string | number | boolean, externalSession?: ClientSession): Promise<Result<IDevice>> {
        return await this.transactionWrap(async (session) => {
            const device = await this.model.findOne({ _id: id, deletedAt: null }).exec() // get the device
            if (!device) {
                return [null, new Error("Device not found")]
            }
            const capability = device.capabilities.get(capabilityKey) // find if the device is even capable of the requested control 
            if (!capability) {
                return [null, new Error("Capability not found on device")]
            }
            if (!this.verifyCapabilityValue(capability.type, newValue, capability)) {
                return [null, new Error("Invalid value for capability")]
            }
            device.currentState.set(capabilityKey, { value: newValue, timestamp: new Date() })
            await device.save({ session })
            return [device, null]
        }, externalSession)
    }

    async create(item: ModelDTO<Omit<IDevice, "currentState">>, externalSession?: ClientSession): Promise<Result<IDevice>> {
        return await this.transactionWrap(async (session) => {
            try {
                const [err] = await this.verifyCapabilities(item.capabilities)
                if (err) {
                    return [null, err]
                }
                const currentState = await this.createCurrentStateMap(item.capabilities)
                const newDevice = new this.model({
                    name: item.name,
                    domainId: item.domainId,
                    createdBy: item.createdBy,
                    capabilities: item.capabilities,
                    currentState
                })
                console.log("New device to be created: ", newDevice)
                await newDevice.save({ session })
                return [newDevice, null]
            }
            catch (error) {
                throw new Error("Error creating device", { cause: error })
            }
        }, externalSession)
    }

    async findById(id: string): Promise<IDevice | null> {
        try {
            if (!id || typeof id !== "string") {
                return null
            }
            const device = await this.model.findOne({ _id: id, deletedAt: null }).exec()
            return device
        } catch (error) {
            throw new Error("Error attempting to find device by id", { cause: error })
        }
    }
    async update(id: string, patch: UpdatePatch<IDevice>, externalSession?: ClientSession): Promise<UpdateResult<IDevice>> {
        return await this.transactionWrap(async (session) => {
            const [updateObject, error] = await this.createUpdateObject(patch)
            if (error) {
                return [null, error]
            }
            const updatedDevice = await this.model.findOneAndUpdate({ _id: id, deletedAt: null }, updateObject, { session, returnDocument: "after" }).exec()
            if (!updatedDevice) {
                return [null, new Error("Device not found")]
            }
            return [updatedDevice, null]
        }, externalSession)
    }
}
