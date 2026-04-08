import type { Result, UpdatePatch } from "@services/common/types";
import { UserRoleModelInstance, DeviceModelInstance } from "../models"
import type { IDevice } from "../types";
import { io } from "../config";
import { SOCKET_EVENTS } from "../constants/";

export async function UpdateDeviceService(userId: string, deviceId: string, patch: UpdatePatch<IDevice>): Promise<Result<IDevice>> {
    try {
        const device = await DeviceModelInstance.findById(deviceId)
        if (!device) {
            return [null, new Error("Device not found")]
        }
        var [userPermissions, err] = await UserRoleModelInstance.userPermisisons(userId, device.domainId as string) // find the user role by user id
        if (err) {
            return [null, err]
        }
        if (!userPermissions || !userPermissions.canManageDevices) {
            return [null, new Error("User does not have permissions to update devices in this domain")]
        }
        var [updatedDevice, err] = await DeviceModelInstance.update(deviceId, patch)
        if (err) {
            return [null, err]
        }
        // better to send the full updated device because user might not have device and the doing patches on client isnt a simple task
        io.to(device.domainId as string).emit(SOCKET_EVENTS.SERVER_EMITTED.DEVICE.DEVICE_INFO_UPDATED, { device: updatedDevice, domainId: device.domainId }); // notify connected clients that a device has been updated
        return [updatedDevice!, null]

    } catch (error) {
        throw new Error("Error in update devices service", { cause: error });
    }
}