/**
 * Mqtt routes - (dont fully get it yet but its like a mix of socketio and rest)
 *
 * Device Emitted -> Server Subscribed
 * device telemetry - /device/+/telemetry - should send (i think it can only send buffers or strings so parse the payload)
 *
 * Server Emitted -> Device Subscribed
 * server commands - /device/+/commands - should receive (parse the payload) -> should send a change of state to the device capabilites , e.g set state from x to y -> {capability: "light", value: "on" / true
 *
 */

import { RecursiveError } from "@services/common/utilities";
import { logger, MqttClientInstance } from "../config";
import { MQTT_TOPICS } from "../constants";
import { HandleDeviceStatus, HandleDeviceTelemetry } from "../handlers/";
export function MqttRoutes() {
	MqttClientInstance.subscribe(
		MQTT_TOPICS.DEVICE_EMITTED.TELEMETRY,
		(err) => {
			if (err) {
				logger.error(
					{ error: RecursiveError(err as Error) },
					"Failed to subscribe to device telemetry topic: ",
				);
			} else {
				logger.info("Subscribed to device telemetry topic");
			}
		},
	);

	MqttClientInstance.subscribe(MQTT_TOPICS.DEVICE_EMITTED.STATUS, (err) => {
		if (err) {
			logger.error(
				{ error: RecursiveError(err as Error) },
				"Failed to subscribe to device status topic: ",
			);
		} else {
			logger.info("Subscribed to device status topic");
		}
	});

	MqttClientInstance.on("message", async (topic, message) => {
		const topicParts = topic.split("/");
		// ["", "device", "deviceId", "telemetry"|"status"]
		const deviceId = topicParts[2];
		if (!deviceId) {
			logger.warn(
				{ topic },
				"Received MQTT message with invalid topic format",
			);
			return;
		}

		if (topicParts[1] === "device" && topicParts[3] === "telemetry") {
			await HandleDeviceTelemetry(deviceId, message);
		} else if (topicParts[1] === "device" && topicParts[3] === "status") {
			await HandleDeviceStatus(deviceId, message);
		}
	});
}
