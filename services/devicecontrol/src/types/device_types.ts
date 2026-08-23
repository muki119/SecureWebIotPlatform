import type { BaseTokenClaims, ModelSchema } from "@services/common/types";
// doing this to avoid circular deps between model and schema - since model uses schema
export enum CapabilityTypes {
	BINARY = "BINARY", // on or off
	RANGE = "RANGE", // a range of values - like a slider
	GAUGE = "GAUGE", // a value that can be read but not set - like a sensor reading
	ENUM = "ENUM", // a value that can be set to one of a predefined set of values - like a dropdown
	COLOR = "COLOR", // a value that can be set to a color - like a color picker
}
export type DeviceCapabilities = {
	label: string; // user friendly label for the capability
	type: CapabilityTypes;
	metric: string; // the unit of measurement for the capability - like celsius for a temperature sensor or percentage for a brightness slider
	min?: number; // for range capabilities - the minimum value
	max?: number; // for range capabilities - the maximum value
	enumValues?: string[]; // for enum capabilities - the predefined set of values
	step?: number; // for range capabilities - the step value for the slider
	// binary needs not additional fields
};

export type CurrentDeviceState = {
	value: string | number | boolean;
	timestamp: Date;
};

export interface IDevice extends ModelSchema {
	_id?: string;
	name: string;
	domainId: string | Buffer;
	createdBy: string | Buffer; // the person who added the device to the domain
	currentState:
		| Map<string, CurrentDeviceState>
		| Record<string, CurrentDeviceState>;
	capabilities:
		| Map<string, DeviceCapabilities>
		| Record<string, DeviceCapabilities>;
}

export interface AddDeviceRequest {
	//
	name: string;
	capabilities: Record<string, DeviceCapabilities>;
}

export type DeviceTelemetry = {
	timestamp: Date; // idexed
	metadata: {
		deviceId: string | Buffer; // indexed
		capability: string; // indexed
	};
	value: string | number | boolean;
};

export type NumericAggregatedTelemetry = {
	avg: number;
	min: number;
	max: number;
};

export type CategoricalAggregatedTelemetry = {
	last: string | number | boolean;
};

export type AggregatedTelemetry = {
	_id?: Date;
} & (NumericAggregatedTelemetry | CategoricalAggregatedTelemetry);

export enum Intervals {
	DAY = "DAY",
	WEEK = "WEEK",
	MONTH = "MONTH",
}
export enum IntervalUnits { // this is for the aggregation pipeline
	DAY = "Hour",
	WEEK = "Day",
	MONTH = "Week",
}

export interface DeviceTokenClaims extends BaseTokenClaims {
	// sub is the device id
	// aud is domain id
	// iss is the issuer - device control
	capabilities: Record<string, DeviceCapabilities>;
}
