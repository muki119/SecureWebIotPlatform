import { STREAMS } from "@services/common/config";
import type { Result, UpdatePatch } from "@services/common/types";
import EventSenderInstance from "../config/event_sender";
import { type IUser, userModel } from "../models/user_model";
import { HashPassword, VerifyPassword } from "../utilities/password_hash";
export default async function CredentialChangeService(
	changes: UpdatePatch<IUser>,
	userId: string,
	password?: string,
): Promise<Result<null>> {
	try {
		for (const changeSet of changes) {
			if (changeSet.field === "password") {
				if (!password) {
					return [
						null,
						new Error(
							"Current password is required to change password",
						),
					];
				}
				const user = await userModel.findById(userId);
				if (!user) {
					return [null, new Error("User not found")];
				}
				const storedPassword = user.password;
				const isPasswordValid = await VerifyPassword(
					password,
					storedPassword,
				);
				if (!isPasswordValid) {
					return [null, new Error("Current password is incorrect")];
				}
				if (password === changeSet.value) {
					return [
						null,
						new Error(
							"New password cannot be the same as the old password",
						),
					];
				}
				changeSet.value = await HashPassword(changeSet.value as string);
				break;
			}
		}
		// probably going to have to send these same changes - to the stream

		const [updatedUser, err] = await userModel.update(userId, changes);
		if (err) {
			return [null, new Error(err.message)];
		}
		if (!updatedUser) {
			// if theres no updated item (somehow) then should probably return an error since this shouldnt be happening since unsuccessful has already been handled
			throw new Error(
				"Update was successful but no updated item was returned",
			);
		}
		const changesToSend = changes
			.filter((change) => change.field !== "password")
			.map((change) => ({
				field: change.field,
				value: change.value,
			})); // dont send password changes to the stream
		await EventSenderInstance.send(STREAMS.AUTH_SERVICE.USER_UPDATED, {
			id: userId,
			changes: JSON.stringify(changesToSend),
			timestamp: new Date().toISOString(),
		});
		// changes to be sent to stream for other services to apply neccessary changes
		return [null, null];
	} catch (error) {
		throw new Error("Error in credential change service", { cause: error });
	}
}
