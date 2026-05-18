import type { Socket } from "socket.io";
import type { DeviceControlUpdateData } from "../../types";
import { MqttClientInstance, logger } from "../../config";
import { DeviceModelInstance, UserRoleModelInstance, DeviceTelemetryModelInstance } from "../../models";
import { MQTT_TOPICS, SOCKET_EVENTS } from "../../constants";

export async function DeviceControlUpdateHandler(socket: Socket, data: DeviceControlUpdateData, callback: any) {
    const ack = typeof callback === "function" ? callback : () => { };
    try {
        const userId = (socket as any).user?.sub;
        const { deviceId, domainId, changes } = data;
        if (!deviceId || !domainId || !changes || !changes.capability || changes.value === undefined || changes.value === null) {
            ack({ code: 400, error: "Invalid data format" });
            return;
        }
        const [userPermissions, permErr] = await UserRoleModelInstance.userPermisisons(userId, domainId);
        if (permErr) {
            logger.error({ error: permErr }, "Error updating device state:");
            return ack({ code: 400, error: "Failed to verify user permissions" });
        }
        if (!userPermissions?.canControlDevices) {
            logger.warn({ userId, domainId }, "Unauthorized device control attempt:");
            ack({ code: 401, error: "Unauthorized" });
            return;
        }
        const [, updateErr] = await DeviceModelInstance.updateCurrentState(deviceId, changes.capability, changes.value);
        if (updateErr) {
            logger.error({ error: updateErr }, "Error updating device state:");
            return ack({ code: 400, error: "Failed to update device state" });
        }
        await MqttClientInstance.publishAsync(MQTT_TOPICS.SERVER_EMITTED.COMMANDS(deviceId), JSON.stringify({ capability: changes.capability, value: changes.value }));
        DeviceTelemetryModelInstance.create(deviceId, changes.capability, changes.value).catch((err) => {
            logger.warn({ err }, "Failed to write telemetry for control update");
        });
        socket.broadcast.to(domainId).emit(SOCKET_EVENTS.SERVER_EMITTED.DEVICE.UPDATED, { deviceId, domainId, changes });
        ack({ code: 200, message: "Device updated successfully" });
    } catch (error) {
        logger.error({ error }, "Error processing device control update:");
        ack({ code: 500, error: "Failed to process changes" });
    }
}