/**
 * MQTT CONFIG  , Connection function and exports a default instance using the evnironment variables for configuration
 */

import mqtt, { type MqttClient, type IClientOptions, type MqttProtocol } from 'mqtt'
import { GetEnvString, GetEnvNumber } from '@services/common/utilities'




export async function ConnectMqtt(options?: IClientOptions): Promise<MqttClient> {
    try {
        const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
        const mqttOptions: IClientOptions = {
            protocol: GetEnvString("MQTT_BROKER_PROTOCOL", "mqtt") as MqttProtocol,
            host: GetEnvString("MQTT_BROKER_HOST"),
            port: GetEnvNumber("MQTT_BROKER_PORT"),
            clientId,
            clean: true,
            connectTimeout: 4000,
            username: GetEnvString("MQTT_BROKER_USERNAME", "device_service_user"),
            password: GetEnvString("MQTT_BROKER_PASSWORD", "vCtAA4nvKTY8ekXuy8RP"),
            reconnectPeriod: 1000,
        }
        return await mqtt.connectAsync(options ? options : mqttOptions)
    } catch (error) {
        throw new Error("Error connecting to MQTT broker", { cause: error })
    }

}



export const MqttClientInstance = await ConnectMqtt()