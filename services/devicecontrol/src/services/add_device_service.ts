import type { ModelDTO, ServiceResult } from "@services/common/types";
import { PAIRING_CODE_REDIS_KEY_PREFIX } from "../constants";
import { CreateDeviceToken } from "../helpers";
import type { AddDeviceRequest, IDevice } from "../types"
import { RedisClient, io, EventBusInstance } from "../config";
import { VerifyPairingCode } from "../helpers";
import { UserRoleModelInstance, DeviceModelInstance } from "../models"
import { SOCKET_EVENTS } from "../constants/";
import { STREAMS } from "@services/common/config"
export async function AddDeviceService(pairingCode: string, deviceInfo: AddDeviceRequest): Promise<ServiceResult<string>> {
    // get the pairing code
    try {
        if (!VerifyPairingCode(pairingCode)) {
            throw new Error("Invalid pairing code");
        }
        const codeInfoString = await RedisClient.get(`${PAIRING_CODE_REDIS_KEY_PREFIX}${pairingCode}`);
        await RedisClient.del(`${PAIRING_CODE_REDIS_KEY_PREFIX}${pairingCode}`)
        if (!codeInfoString) {
            return [null, new Error("Pairing code not found")];
        }
        const codeInfo: { userId: string, domainId: string } = JSON.parse(codeInfoString);
        if (!codeInfo.userId || !codeInfo.domainId) {
            throw new Error("Invalid pairing code data");
        }
        var [userPermissions, err] = await UserRoleModelInstance.userPermisisons(codeInfo.userId, codeInfo.domainId)
        if (err) {
            return [null, err]
        }
        if (!userPermissions?.canManageDevices) { // this shouldnt ever happen because of the checks in the create pairing code service , but user role can change between
            return [null, new Error("Not authorized to add device to this domain")];
        }
        const capabilitiesMap = new Map(Object.entries(deviceInfo.capabilities))
        const deviceData: ModelDTO<Omit<IDevice, 'currentState'>> = {
            ...deviceInfo,
            createdBy: codeInfo.userId,
            domainId: codeInfo.domainId,
            capabilities: capabilitiesMap
        }

        var [device, err] = await DeviceModelInstance.create(deviceData)
        if (err !== null) {
            return [null, err]
        }
        const deviceToken = CreateDeviceToken(device!)
        io.to(codeInfo.domainId).emit(SOCKET_EVENTS.SERVER_EMITTED.DEVICE.ADDED, { domainId: codeInfo.domainId, device });
        await EventBusInstance.send(STREAMS.DEVICE_SERVICE.DEVICE_CREATED, { deviceId: device!.id, domainId: codeInfo.domainId, initiatorId: codeInfo.userId })
        return [deviceToken, null]
    } catch (error) {
        throw new Error("Failed to add device", { cause: error });
    }

    // retrieve the domain information from the pairing code
    // check user permissions for the domain
    // create the device
    // the output device will create the device token to be returned to the device for authentication 
}