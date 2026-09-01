import type { CapabilityTypes } from "@/constants/capability_types";
import type { ROLES } from "@/constants/role_permissions";

export type OpperationType = "CREATE" | "UPDATE" | "DELETE";
export interface ITransactionModel {
	id: string;
	createdAt: Date;
	initiatorId: string;
	opperationType: OpperationType;
	opperationTarget: string;
	targetId: string;
	value: Record<string, unknown> | null; // this will hold any additional information about the transaction that might be useful for auditing or debugging purposes - for example, if the transaction is about a user role update, we can store the new role in this field
	opperationTimestamp: Date;
	domainId: string;
}

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type User = {
	id: string;
	userId: string;
	role: Role;
	name: string;
	email: string;
	dateJoined: string;
};

export interface IProfile {
	userId: string;
	email: string;
	name: string;
}
export type Domain = {
	id: string;
	name: string;
	ownerId: string;
	createdAt: string;
	role: Role;
	users: Record<string, User>;
	[key: string]: unknown;
};

export type Domains = Record<string, Domain>;

export type DomainDevices = Record<string, Record<string, IDevice>>;

export type CapabilityType =
	(typeof CapabilityTypes)[keyof typeof CapabilityTypes];

type DeviceCapabilityUnion =
	| BinaryCapability
	| RangeCapability
	| GaugeCapability
	| EnumCapability
	| ColorCapability;

type CurrentDeviceStateUnion =
	| BinaryCurrentCapabilityState
	| RangeCurrentCapabilityState
	| GaugeCurrentCapabilityState
	| EnumCurrentCapabilityState
	| ColorCurrentCapabilityState;

export type DeviceCapabilities<T extends CapabilityType = CapabilityType> =
	Extract<DeviceCapabilityUnion, { type: T }>;

export type CurrentDeviceState<T extends CapabilityType = CapabilityType> =
	Extract<CurrentDeviceStateUnion, { type: T }>;

export interface IDevice {
	id: string;
	name: string;
	domainId: string;
	createdBy: string; // the person who added the device to the domain
	currentState: Record<string, CurrentDeviceState>;
	capabilities: Record<string, DeviceCapabilities>;
	createdAt: string;
	online?: boolean;
}

type BaseCapability = {
	type: CapabilityType;
	label: string;
	metric: string;
};

export type BinaryCapability = BaseCapability & {
	type: typeof CapabilityTypes.BINARY;
};
export type RangeCapability = BaseCapability & {
	type: typeof CapabilityTypes.RANGE;
	min: number;
	max: number;
	step: number;
};
export type GaugeCapability = BaseCapability & {
	type: typeof CapabilityTypes.GAUGE;
	min: number;
	max: number;
};
export type EnumCapability = BaseCapability & {
	type: typeof CapabilityTypes.ENUM;
	enumValues: string[];
};
export type ColorCapability = BaseCapability & {
	type: typeof CapabilityTypes.COLOR;
};

export type BaseCurrentCapabilityState = {
	type?: CapabilityType;
	value: string | number | boolean;
	timestamp: Date | number;
};
export type BinaryCurrentCapabilityState = BaseCurrentCapabilityState & {
	type: typeof CapabilityTypes.BINARY;
	value: boolean | 0 | 1;
};
export type RangeCurrentCapabilityState = BaseCurrentCapabilityState & {
	type: typeof CapabilityTypes.RANGE;
	value: number;
};
export type GaugeCurrentCapabilityState = BaseCurrentCapabilityState & {
	type: typeof CapabilityTypes.GAUGE;
	value: number;
};
export type EnumCurrentCapabilityState = BaseCurrentCapabilityState & {
	type: typeof CapabilityTypes.ENUM;
	value: string;
};
export type ColorCurrentCapabilityState = BaseCurrentCapabilityState & {
	type: typeof CapabilityTypes.COLOR;
	value: string; // hex color code
};

export type DeviceManagementInfo = Pick<IDevice, "id" | "name"> & {
	createdAt?: string;
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
	_id: string;
} & (NumericAggregatedTelemetry | CategoricalAggregatedTelemetry);
