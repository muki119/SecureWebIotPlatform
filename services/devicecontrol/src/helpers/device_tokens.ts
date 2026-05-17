import jwt from "jsonwebtoken"
import type { DeviceTokenClaims, IDevice } from "../types"
import { GetEnvString } from "@services/common/utilities";
import { logger } from "../config";
import type { Result } from "@services/common/types";

// token will only be symmetric for now 
export const DEVICE_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 60 // 60 days should be enough
export function CreateDeviceToken(device: IDevice): string {
    try {
        const payload: Partial<DeviceTokenClaims> = {
            sub: device.id,
            aud: device.domainId as string,
            iss: "device-control",
            exp: Math.floor(Date.now() / 1000) + DEVICE_TOKEN_EXPIRY_SECONDS,
            iat: Math.floor(Date.now() / 1000),
            capabilities: device.capabilities instanceof Map ? Object.fromEntries(device.capabilities) : device.capabilities as Record<string, DeviceCapabilities>
        };
        return jwt.sign(payload, GetEnvString("DEVICE_TOKEN_SECRET_KEY"), { algorithm: 'HS256', });
    } catch (error) {
        throw new Error("Error creating device token", { cause: error });
    }
}

export function VerifyDeviceToken(token: string): Result<DeviceTokenClaims> {
    try {
        const r = jwt.verify(token, GetEnvString("DEVICE_TOKEN_SECRET_KEY"), { algorithms: ['HS256'] }) as DeviceTokenClaims
        return [r, null]
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return [null, new Error("Token expired")]; // token is expired - treat as invalid
        }
        if (error instanceof jwt.JsonWebTokenError) { // if theres any token invalidity like signature is different or the token is malformed
            logger.warn({ error }, `Invalid device token:`); // log the invalid token for debugging - should be safe since these tokens are all invalid to the system
            return [null, new Error("Invalid token")];
        }
        throw new Error(`Error verifying device token`, { cause: error });
    }
}