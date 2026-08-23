import { io, logger } from "../../config";
import { SOCKET_EVENTS } from "../../constants";
import { DeviceModelInstance } from "../../models";

export async function HandleDeviceStatus(deviceId: string, message: Buffer) {
	try {
		const status = message.toString().trim().toLowerCase();
		if (status !== "online" && status !== "offline") return;

		const device = await DeviceModelInstance.findById(deviceId);
		if (!device) {
			logger.warn({ deviceId }, "Status update for unknown device:");
			return;
		}

		io.to(device.domainId as string).emit(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.STATUS,
			{
				deviceId,
				domainId: device.domainId.toString(),
				online: status === "online",
			},
		);
	} catch (error) {
		logger.error({ error }, "Error handling device status:");
	}
}
