import type { Result } from "@services/common/types";
import { UserRoleModelInstance, DeviceModelInstance } from "../models"
import type { IDevice } from "../types";


export async function DeleteDeviceService(userId: string, deviceId: string): Promise<Result<IDevice>> {
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
            return [null, new Error("User does not have permissions to delete devices in this domain")]
        }
        var [deletedDevice, err] = await DeviceModelInstance.delete(deviceId)
        if (err) {
            return [null, err]
        }
        return [deletedDevice!, null]

    } catch (error) {
        throw new Error("Error in delete devices service", { cause: error });
    }
}