import { DeviceTelemetryModelInstance, DeviceModelInstance, DeviceModel } from "../../models";
import { SOCKET_EVENTS } from "../../constants";
import { io, logger, MqttClientInstance } from "../../config";

// this handler gets the telemetry data from devices and then gets 
export async function HandleDeviceTelemetry(deviceId: string, message: Buffer) {
    // get device data from the topic
    // add to db
    // send to domain room for device telemetry update
    try {
        const { capability, value } = JSON.parse(message.toString()) as { capability: string, value: string | number | boolean };
        DeviceTelemetryModelInstance.create(deviceId, capability, value).catch((err) => {
            logger.warn({ err }, "Failed to write telemetry for device emitted telemetry");
        });
        const [updatedDevice, err] = await DeviceModelInstance.updateCurrentState(deviceId, capability, value);
        if (err) {
            logger.error({ error: err }, "Error updating device state:");
            if (err === DeviceModel.ErrDeviceNotFound) {
                logger.info({ deviceId }, "Device not found");
                MqttClientInstance.publish(`/device/${deviceId}/unlinked`, JSON.stringify({ deviceId }))
            }
            return;
        }
        io.to(updatedDevice.domainId as string).emit(SOCKET_EVENTS.SERVER_EMITTED.DEVICE.TELEMETRY, { deviceId, domainId: updatedDevice.domainId.toString(), capability, value });
        return
    } catch (error) {
        logger.error({ error }, "Error handling device telemetry:");
        return;
    }
}