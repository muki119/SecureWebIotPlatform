
export const MQTT_TOPICS = {
    SERVER_EMITTED: {
        COMMANDS(deviceId: string) {
            return `/device/${deviceId}/commands`
        }
    },
    DEVICE_EMITTED: {
        TELEMETRY: "/device/+/telemetry"
    }
}