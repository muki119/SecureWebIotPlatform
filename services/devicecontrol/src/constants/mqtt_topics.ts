
export const MQTT_TOPICS = {
    SERVER_EMITTED: {
        COMMANDS(deviceId: string) {
            return `/device/${deviceId}/commands`
        },
        UNLINKED(deviceId: string) {
            return `/device/${deviceId}/unlinked`
        }
    },
    DEVICE_EMITTED: {
        TELEMETRY: "/device/+/telemetry",
        STATUS: "/device/+/status"
    }
}