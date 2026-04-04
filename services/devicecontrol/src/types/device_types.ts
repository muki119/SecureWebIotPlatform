import type { ModelDTO, ModelSchema } from "@services/common/types"
import { Schema } from "mongoose";
// doing this to avoid circular deps between model and schema - since model uses schema
export enum CapabilityTypes {
    BINARY = "BINARY", // on or off
    RANGE = "RANGE", // a range of values - like a slider
    GUAGE = "GAUGE", // a value that can be read but not set - like a sensor reading
    ENUM = "ENUM", // a value that can be set to one of a predefined set of values - like a dropdown
    COLOR = "COLOR", // a value that can be set to a color - like a color picker
}
export type DeviceCapabilities = {
    Label: string, // user friendly label for the capability
    type: CapabilityTypes,
    metric: string, // the unit of measurement for the capability - like celsius for a temperature sensor or percentage for a brightness slider
    min?: number, // for range capabilities - the minimum value
    max?: number, // for range capabilities - the maximum value
    enumValues?: string[], // for enum capabilities - the predefined set of values
    // binary needs not additional fields 
}
export type CurrentDeviceState = {
    value: string | number | boolean,
    timestamp: Date
}

export interface IDevice extends ModelSchema {
    name: string,
    domainId: string | Schema.Types.UUID,
    createdBy: string | Schema.Types.UUID,// the person who added the device to the domain
    currentState: Map<string, CurrentDeviceState>,
    capabilities: Map<string, DeviceCapabilities>, // list of capabilities the device has - used for control and permissioning
}

export type DeviceTelemetry = {
    timestamp: Date, // idexed
    metadata: {
        deviceId: string | Schema.Types.UUID, // indexed
        capability: string, // indexed
    }
    value: string | number | boolean
}

