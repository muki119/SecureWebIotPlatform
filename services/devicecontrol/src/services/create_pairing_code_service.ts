import type { Result } from "@services/common/types";
import { RedisClient } from "../config";
import {
	PAIRING_CODE_EXPIRY_SECONDS,
	PAIRING_CODE_REDIS_KEY_PREFIX,
} from "../constants";
import { GeneratePairingCode } from "../helpers";
import { UserRoleModelInstance } from "../models";
export async function CreatePairingCodeService(
	userId: string,
	domainId: string,
): Promise<Result<{ pairingCode: string; expiry: Date }, Error>> {
	try {
		const [userPermissions, err] =
			await UserRoleModelInstance.userPermisisons(userId, domainId);
		if (err) {
			return [null, err];
		}
		if (!userPermissions?.canManageDevices) {
			return [
				null,
				new Error(
					"User does not have permission to manage devices in this domain",
				),
			];
		}
		const pairingCode = await GeneratePairingCode();
		const expiry = new Date(
			Date.now() + PAIRING_CODE_EXPIRY_SECONDS * 1000,
		); // pairing code expires in 5 minutes
		const result = await RedisClient.set(
			`${PAIRING_CODE_REDIS_KEY_PREFIX}${pairingCode}`,
			JSON.stringify({ userId, domainId }),
			{
				condition: "NX",
				expiration: { type: "EX", value: PAIRING_CODE_EXPIRY_SECONDS },
			},
		); // store pairing code in redis with expiry

		if (result !== "OK") {
			throw new Error("Failed to store pairing code");
		}
		return [{ pairingCode, expiry }, null];
	} catch (error) {
		throw new Error("Error in create pairing code service", {
			cause: error,
		});
	}
}
