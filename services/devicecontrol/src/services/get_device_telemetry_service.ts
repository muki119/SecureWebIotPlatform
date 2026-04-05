import type { ServiceResult } from "@services/common/types";
import { DeviceModelInstance, UserRoleModelInstance, DeviceTelemetryModelInstance } from "../models";
import { Intervals } from "../types";

export async function GetDeviceTelemetryService(userId: string, deviceId: string, capability: string, interval: Intervals, from: Date): Promise<ServiceResult<any>> {
    try {
        // Implementation for fetching device telemetry
        const device = await DeviceModelInstance.findById(deviceId) // find device by id
        if (!device) {
            return [null, new Error("Device not found")]
        }
        var [isMember, err] = await UserRoleModelInstance.isMember(userId, device.domainId as string) // check if the user is a member of the devices domain
        if (err) {
            return [null, err]
        }
        if (!isMember) {
            return [null, new Error("User is not a member of the device's domain")]
        }
        const capabilityType = device.capabilities.get(capability)?.type // get the capability type from the device capabilities map
        if (!capabilityType) {
            return [null, new Error("Capability not found on device")]
        }
        var [telemetryData, err] = await DeviceTelemetryModelInstance.findByDeviceId(deviceId, capability, capabilityType, from, interval) // get the telemetry data for the device and capability
        if (err) {
            return [null, err]
        }
        return [telemetryData, null]
    } catch (error) {
        throw new Error("Error in get device telemetry service", { cause: error })
    }
}