export const MQTT_TOPICS = {
	SERVER_EMITTED: {
		COMMANDS(deviceId: string) {
			return `/device/${deviceId}/commands`;
		},
		UNLINKED(deviceId: string) {
			return `/device/${deviceId}/unlinked`;
		},
		DOMAIN(domainId: string) {
			return {
				DELETED: `/domain/${domainId}/deleted`,
			} as const;
		},
	},
	DEVICE_EMITTED: {
		TELEMETRY: "/device/+/telemetry",
		STATUS: "/device/+/status",
	},
};
