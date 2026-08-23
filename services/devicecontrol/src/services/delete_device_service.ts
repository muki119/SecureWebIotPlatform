import { STREAMS } from "@services/common/config";
import type { Result } from "@services/common/types";
import { EventBusInstance, io, MqttClientInstance } from "../config";
import { MQTT_TOPICS, SOCKET_EVENTS } from "../constants/";
import { DeviceModelInstance, UserRoleModelInstance } from "../models";
import type { IDevice } from "../types";
export async function DeleteDeviceService(
	userId: string,
	deviceId: string,
): Promise<Result<IDevice>> {
	try {
		const device = await DeviceModelInstance.findById(deviceId);
		if (!device) {
			return [null, new Error("Device not found")];
		}
		const [userPermissions, userPermissionsErr] =
			await UserRoleModelInstance.userPermisisons(
				userId,
				device.domainId as string,
			); // find the user role by user id
		if (userPermissionsErr) {
			return [null, userPermissionsErr];
		}
		if (!userPermissions?.canManageDevices) {
			return [
				null,
				new Error(
					"User does not have permissions to delete devices in this domain",
				),
			];
		}
		const [deletedDevice, deleteErr] =
			await DeviceModelInstance.delete(deviceId);
		if (deleteErr) {
			return [null, deleteErr];
		}

		io.to(device.domainId as string).emit(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.REMOVED,
			{ deviceId: device.id, domainId: device.domainId },
		);
		await MqttClientInstance.publish(
			MQTT_TOPICS.SERVER_EMITTED.UNLINKED(device.id),
			JSON.stringify({ deviceId: device.id }),
		);
		await EventBusInstance.send(STREAMS.DEVICE_SERVICE.DEVICE_DELETED, {
			deviceId: device.id,
			domainId: device.domainId as string,
			initiatorId: userId,
		});
		return [deletedDevice, null];
	} catch (error) {
		throw new Error("Error in delete devices service", { cause: error });
	}
}
