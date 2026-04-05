import type { Result, UpdatePatch } from "@services/common/types";
import { UserRoleModelInstance, DeviceModelInstance } from "../models"
import type { IDevice } from "../types";


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
        return [updatedDevice!, null]

    } catch (error) {
        throw new Error("Error in update devices service", { cause: error });
    }
}