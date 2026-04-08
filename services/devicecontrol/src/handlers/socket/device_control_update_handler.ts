import type { Socket } from "socket.io";
import type { DeviceControlUpdateData } from "../../types";
import { MqttClientInstance, logger } from "../../config";
import { DeviceModelInstance, UserRoleModelInstance } from "../../models";
import { MQTT_TOPICS, SOCKET_EVENTS } from "../../constants";

export async function DeviceControlUpdateHandler(socket: Socket, data: DeviceControlUpdateData, callback: any) {
    try {
        const userId = (socket as any).user?.sub;
        const { deviceId, domainId, changes } = data; // get device id and changes to be made
        if (!deviceId || !domainId || !changes || !changes.capability || !changes.value) {
            callback({ code: 400, error: "Invalid data format" });
            return;
        }
        var [userPermissions, err] = await UserRoleModelInstance.userPermisisons(userId, domainId);
        if (err) {
            logger.error({ error: err }, "Error updating device state:");
            return callback({ code: 400, error: "Failed to verify user permissions" });
        }
        if (!userPermissions?.canControlDevices) {
            logger.warn({ userId, domainId }, "Unauthorized device control attempt:");
            callback({ code: 403, error: "Unauthorized" }); // use cannot do that
            return;
        }
        var [_, err] = await DeviceModelInstance.updateCurrentState(deviceId, changes.capability, changes.value);
        if (err) {
            logger.error({ error: err }, "Error updating device state:");
            return callback({ code: 400, error: "Failed to update device state" });
        }
        const deviceErr = await MqttClientInstance.publishAsync(MQTT_TOPICS.SERVER_EMITTED.COMMANDS(deviceId), JSON.stringify({ capability: changes.capability, value: changes.value }));
        if (deviceErr) {
            logger.error({ error: deviceErr }, "Error publishing device control command to mqtt:");
            return callback({ code: 400, error: "Failed to send command to device" });
        }
        socket.broadcast.to(domainId).emit(SOCKET_EVENTS.SERVER_EMITTED.DEVICE.UPDATED, { deviceId, domainId, changes });
        callback({ code: 200, message: "Device updated successfully" })
        return;
    } catch (error) {
        logger.error({ error }, "Error processing device control update:");
        callback({ code: 500, error: "Failed to process changes" })
        return;
    }

}