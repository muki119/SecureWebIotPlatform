/**
 * This package contains a demo device that simulates all capabilitity types available in the secure web iot platform.
 * 
 * 
 */
import mqtt, { type MqttClient } from "mqtt";
import readline from "node:readline";
import { DatabaseSync } from "node:sqlite";
import sysInfo from "systeminformation";


type Result<T> = [T | null, Error | null]
const db = new DatabaseSync("device.db");
db.exec(`
    CREATE TABLE IF NOT EXISTS device (
        id INTEGER PRIMARY KEY,
        device_id TEXT NOT NULL,
        token TEXT NOT NULL
    )
`);

function setCredentials(deviceId: string, token: string) {
    db.prepare("DELETE FROM device").run();
    db.prepare("INSERT INTO device (device_id, token) VALUES (?, ?)").run(deviceId, token);
    console.log("Credentials saved to device.db");
}

function getCredentials(): { deviceId: string, token: string } | null {
    const row = db.prepare("SELECT device_id, token FROM device LIMIT 1").get() as any;
    return row ? { deviceId: row.device_id, token: row.token } : null;
}

const DEVICE_SERVICE_URL = process.env.DEVICE_SERVICE_URL || "http://localhost/api/v1/device";
const MQTT_HOST = process.env.MQTT_BROKER_HOST || "localhost";
const MQTT_PORT = parseInt(process.env.MQTT_BROKER_PORT || "1884");

const capabilities = {
    power: { Label: "Power", type: "BINARY", metric: "boolean" },
    brightness: { Label: "Brightness", type: "RANGE", metric: "percentage", min: 0, max: 100 },
    temperature: { Label: "Temperature", type: "GAUGE", metric: "celsius" },
    mode: { Label: "Mode", type: "ENUM", metric: "state", enumValues: ["low", "medium", "high"] },
    color: { Label: "Color", type: "COLOR", metric: "hex" }
}

const state: Record<string, any> = {
    power: false,
    brightness: 50,
    temperature: 22.5,
    mode: "low",
    color: "#ffffff"
}

function getPairingCode(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question("Enter pairing code: ", (code) => {
            rl.close();
            resolve(code.trim().toUpperCase());
        });
    });
}

async function activateDevice(pairingCode: string): Promise<Result<{ deviceId: string, token: string }>> {
    console.log("Activating device...");
    const res = await fetch(`${DEVICE_SERVICE_URL}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: pairingCode,
            deviceInfo: {
                name: "Demo Device",
                capabilities
            }
        })
    });
    if (!res.ok) {
        const body = await res.json();
        return [null, new Error(`Activation failed: ${JSON.stringify(body)}`)];
    }
    const { token } = await res.json() as { token: string, [key: string]: any };
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
    return [{ deviceId: payload.sub, token }, null];
}

function sendTelemetry(client: MqttClient, deviceId: string, capability: string, value: any) {
    client.publish(
        `/device/${deviceId}/telemetry`,
        JSON.stringify({ capability, value }),
        { qos: 0 },
        (err) => {
            if (err) console.error(`Telemetry error for ${capability}:`, err);
            else console.log(`Telemetry — ${capability}: ${value}`);
        }
    );
}

function connectMqtt(deviceId: string, token: string): MqttClient {
    const client = mqtt.connect({
        host: MQTT_HOST,
        port: MQTT_PORT,
        protocol: "mqtt",
        username: deviceId,
        password: token,
        clientId: `test_device_${deviceId}`,
        clean: true,
        reconnectPeriod: 3000,
    });

    client.on("connect", () => {
        console.log(`Connected to MQTT broker as device ${deviceId}`);
        client.subscribe(`/device/${deviceId}/commands`, { qos: 2 }, (err) => {
            if (err) console.error("Subscribe error:", err);
            else console.log("Subscribed to commands");
        });

        // send initial state
        for (const [capability, value] of Object.entries(state)) {
            sendTelemetry(client, deviceId, capability, value);
        }

        // simulate temperature sensor every 5 seconds
        setInterval(async () => {
            state.temperature = parseFloat((20 + Math.random() * 10).toFixed(2)); // random temp between 20-30
            sendTelemetry(client, deviceId, "temperature", state.temperature);
        }, 5000);
    });

    client.on("message", (topic, message) => {
        try {
            const { capability, value } = JSON.parse(message.toString());
            console.log(`Command — ${capability}: ${value}`);
            if (capability in state) {
                state[capability] = value;
                sendTelemetry(client, deviceId, capability, value); // confirm state change
            } else {
                console.log(`Unknown capability: ${capability}`);
            }
        } catch (err) {
            console.log("Failed to parse command:", err);
        }
    });

    client.on("error", (err) => console.error("MQTT error:", err));
    client.on("reconnect", () => console.log("Reconnecting..."));
    client.on("close", () => console.log("Connection closed"));
    client.on("disconnect", (packet) => console.log("Disconnect packet:", packet));

    return client;
}

async function main() {
    try {
        let credentials = getCredentials();
        let err, activatedCredentials;
        if (credentials) {
            console.log(`Found credentials for device ${credentials.deviceId}, skipping pairing flow`);
        } else { // if theres no credentials stored - meaning device not paired

            while (!activatedCredentials) {
                const pairingCode = await getPairingCode(); // ask user to input pairing code
                [activatedCredentials, err] = await activateDevice(pairingCode); // activate device
                if (err) {
                    console.error("Activation failed:", err);
                }
            }
            credentials = activatedCredentials!;
            setCredentials(credentials.deviceId, credentials.token); // set credentials in local sqlite db for future use
            console.log(`Device activated - ID: ${credentials.deviceId}`);
        }

        const client = connectMqtt(credentials.deviceId, credentials.token);

        process.on("SIGINT", () => {
            console.log("Shutting down...");
            client.end();
            db.close();
            process.exit(0);
        });

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();