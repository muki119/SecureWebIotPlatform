import type { Result, UpdatePatch } from "@services/common/types";
import { UserRoleModelInstance, DeviceModelInstance } from "../models"
import type { IDevice } from "../types";
import { io, EventBusInstance } from "../config";
import { SOCKET_EVENTS } from "../constants/";
import { STREAMS } from "@services/common/config"
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
        await EventBusInstance.send(STREAMS.DEVICE_SERVICE.DEVICE_UPDATED, { deviceId: updatedDevice!.id, domainId: device.domainId as string, initiatorId: userId, changes: JSON.stringify(patch) }) // send the updated device info to the event bus - we can send the whole updated device info or just the changes and the device id and domain id and let the other services decide if they want to fetch the updated device info or not - for now we will send just the changes and the device id and domain id and let the other services decide if they want to fetch the updated device info or not;
        return [updatedDevice!, null]

    } catch (error) {
        throw new Error("Error in update devices service", { cause: error });
    }
}