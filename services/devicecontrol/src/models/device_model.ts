import {
	type ModelDTO,
	MongoDatabaseModel,
	type Result,
	type UpdatePatch,
	type UpdateResult,
} from "@services/common/types";
import type { ClientSession } from "mongoose";
import { MongoConnection } from "../config";
import DeviceSchema from "../db/device_schema.ts";
import type { CurrentDeviceState, DeviceCapabilities, IDevice } from "../types";
import { CapabilityTypes } from "../types";

export class DeviceModel extends MongoDatabaseModel<IDevice> {
	public static ErrDeviceNotFound = new Error("Device not found");
	protected updatableFieldMap = new Map<keyof ModelDTO<IDevice>, string>([
		["name", "string"],
	]);

	async createCurrentStateMap(
		capabilities: Map<string, DeviceCapabilities>,
	): Promise<Map<string, CurrentDeviceState>> {
		// makes current state from capabilities
		try {
			const currentState = new Map<string, CurrentDeviceState>();
			capabilities.forEach((capability, key) => {
				let initialValue: string | number | boolean;
				switch (capability.type) {
					case "BINARY":
						initialValue = false;
						break;
					case "RANGE":
						initialValue = capability.min ?? 0;
						break;
					case "GAUGE":
						initialValue = 0;
						break;
					case "ENUM": {
						const firstEnumValue = capability.enumValues?.[0];
						if (!firstEnumValue) {
							throw new Error(
								`Capability ${key} of type ENUM must have at least one enum value`,
							);
						}

						initialValue = firstEnumValue;
						break;
					}
					case "COLOR":
						initialValue = "#000000";
						break;
					default:
						throw new Error(
							`Unsupported capability type: ${capability.type}`,
						);
				}
				currentState.set(key, {
					value: initialValue,
					timestamp: new Date(),
				});
			});
			return currentState;
		} catch (error) {
			throw new Error("Error creating current state map", {
				cause: error,
			});
		}
	}

	async verifyCapabilities(
		capabilities: Map<string, DeviceCapabilities>,
	): Promise<[Error] | [null]> {
		try {
			for (const [key, capability] of capabilities.entries()) {
				if (!capability.label || typeof capability.label !== "string") {
					return [
						new Error(`Capability ${key} is missing a valid label`),
					];
				}
				if (
					!capability.type ||
					typeof capability.type !== "string" ||
					!Object.values(CapabilityTypes).includes(capability.type)
				) {
					return [new Error(`Capability ${key} has an invalid type`)];
				}
				if (
					!capability.metric ||
					typeof capability.metric !== "string"
				) {
					return [
						new Error(
							`Capability ${key} is missing a valid metric`,
						),
					];
				}
				switch (capability.type) {
					case "RANGE":
						if (
							typeof capability.min !== "number" ||
							typeof capability.max !== "number"
						) {
							return [
								new Error(
									`Capability ${key} of type RANGE must have min and max values that are numbers`,
								),
							];
						}
						if (capability.min >= capability.max) {
							return [
								new Error(
									`Capability ${key} of type RANGE must have min value less than max value`,
								),
							];
						}
						if (
							capability.step !== undefined &&
							(typeof capability.step !== "number" ||
								capability.step <= 0)
						) {
							return [
								new Error(
									`Capability ${key} of type RANGE has an invalid step value`,
								),
							];
						}
						break;
					case "ENUM":
						if (
							!capability.enumValues ||
							!Array.isArray(capability.enumValues) ||
							capability.enumValues.some(
								(ev) => typeof ev !== "string",
							)
						) {
							return [
								new Error(
									`Capability ${key} of type ENUM must have an array of string enumValues`,
								),
							];
						}
						break;
					case "BINARY":
					case "GAUGE":
					case "COLOR":
						break;
					default:
						return [
							new Error(
								`Unsupported capability type: ${capability.type}`,
							),
						];
				}
			}
			return [null];
		} catch (error) {
			throw new Error("Error verifying capabilities", { cause: error });
		}
	}

	async delete(
		id: string,
		_externalSession?: ClientSession,
	): Promise<Result<IDevice>> {
		try {
			const deleted = await this.model
				.findOneAndUpdate(
					{ _id: id, deletedAt: null },
					{ $set: { deletedAt: new Date() } },
				)
				.exec();
			if (!deleted) {
				return [null, new Error("Device not found")];
			}
			return [
				{
					...deleted.toObject({ flattenMaps: true, virtuals: true }),
					id: deleted._id.toString(),
					domainId: deleted.domainId.toString(),
					createdBy: deleted.createdBy.toString(),
				},
				null,
			];
		} catch (error) {
			throw new Error("Error deleting device", { cause: error });
		}
	}

	verifyCapabilityValue(
		capabilityType: CapabilityTypes,
		value: string | number | boolean,
		capabilityDetails: DeviceCapabilities,
	): boolean {
		switch (capabilityType) {
			case "BINARY":
				return typeof value === "boolean";
			case "RANGE":
				return (
					typeof value === "number" &&
					value >= (capabilityDetails.min ?? Number.MIN_VALUE) &&
					value <= (capabilityDetails.max ?? Number.MAX_VALUE)
				);
			case "GAUGE":
				return typeof value === "number";
			case "ENUM":
				return (
					typeof value === "string" &&
					capabilityDetails.enumValues?.includes(value) === true
				);
			case "COLOR":
				return (
					typeof value === "string" &&
					/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(value)
				); // test if its a valid hex colour - could also adding support for rgb/hsl and whatnot
			default:
				return false;
		}
	}

	async findByDomainId(domainId: string): Promise<Result<IDevice[]>> {
		try {
			if (!domainId || typeof domainId !== "string") {
				return [null, new Error("Invalid domain id")];
			}
			const devices = await this.model
				.find({ domainId, deletedAt: null })
				.exec();
			return [devices, null];
		} catch (error) {
			throw new Error(
				"Error attempting to find all devices under domain id ",
				{ cause: error },
			);
		}
	}

	async updateCurrentState(
		id: string,
		capabilityKey: string,
		newValue: string | number | boolean,
		_externalSession?: ClientSession,
	): Promise<Result<IDevice>> {
		const device = await this.model
			.findOne({ _id: id, deletedAt: null })
			.exec(); // get the device
		if (!device) {
			return [null, DeviceModel.ErrDeviceNotFound];
		}
		device.currentState = device.currentState as Map<
			string,
			CurrentDeviceState
		>; // typescript map voodoo - mongoose maps are weird
		device.capabilities = device.capabilities as Map<
			string,
			DeviceCapabilities
		>;
		const capability = device.capabilities.get(capabilityKey); // find if the device is even capable of the requested control
		if (!capability) {
			return [null, new Error("Capability not found on device")];
		}
		if (
			!this.verifyCapabilityValue(capability.type, newValue, capability)
		) {
			return [null, new Error("Invalid value for capability")];
		}
		device.currentState.set(capabilityKey, {
			value: newValue,
			timestamp: new Date(),
		});
		await device.save();
		return [
			{
				...device.toObject({ flattenMaps: true, virtuals: true }),
				id: device._id.toString(),
				domainId: device.domainId.toString(),
				createdBy: device.createdBy.toString(),
			},
			null,
		];
	}

	async create(
		item: ModelDTO<Omit<IDevice, "currentState">>,
		_externalSession?: ClientSession,
	): Promise<Result<IDevice>> {
		try {
			const [err] = await this.verifyCapabilities(
				item.capabilities as Map<string, DeviceCapabilities>,
			); // theyre in map state here
			if (err) {
				return [null, err];
			}
			const currentState = await this.createCurrentStateMap(
				item.capabilities as Map<string, DeviceCapabilities>,
			);
			const newDevice = new this.model({
				name: item.name,
				domainId: item.domainId,
				createdBy: item.createdBy,
				capabilities: item.capabilities,
				currentState,
			});
			await newDevice.save();
			return [
				{
					...newDevice.toObject({
						flattenMaps: true,
						virtuals: true,
					}),
					id: newDevice._id.toString(),
					domainId: newDevice.domainId.toString(),
					createdBy: newDevice.createdBy.toString(),
				},
				null,
			];
		} catch (error) {
			throw new Error("Error creating device", { cause: error });
		}
	}

	async findById(id: string): Promise<IDevice | null> {
		try {
			if (!id || typeof id !== "string") {
				return null;
			}
			const device = await this.model
				.findOne({ _id: id, deletedAt: null })
				.exec();
			if (!device) {
				return null;
			}
			return {
				...device.toObject({ flattenMaps: true, virtuals: true }),
				id: device._id.toString(),
				domainId: device.domainId.toString(),
			};
		} catch (error) {
			throw new Error("Error attempting to find device by id", {
				cause: error,
			});
		}
	}
	async update(
		id: string,
		patch: UpdatePatch<IDevice>,
		_externalSession?: ClientSession,
	): Promise<UpdateResult<IDevice>> {
		try {
			const [updateObject, error] = await this.createUpdateObject(patch);
			if (error) {
				return [null, error];
			}
			const updatedDevice = await this.model
				.findOneAndUpdate({ _id: id, deletedAt: null }, updateObject, {
					returnDocument: "after",
				})
				.exec();
			if (!updatedDevice) {
				return [null, DeviceModel.ErrDeviceNotFound];
			}
			return [
				{
					...updatedDevice.toObject({
						flattenMaps: true,
						virtuals: true,
					}),
					id: updatedDevice._id.toString(),
					domainId: updatedDevice.domainId.toString(),
					createdBy: updatedDevice.createdBy.toString(),
				},
				null,
			];
		} catch (error) {
			throw new Error("Error updating device", { cause: error });
		}
	}
}

export const DeviceModelInstance = new DeviceModel(
	MongoConnection,
	DeviceSchema,
	"Devices",
);
