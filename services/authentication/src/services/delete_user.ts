import type { Result } from "@services/common/types"
import { VerifyPassword } from "../utilities/password_hash"
import { userModel } from "../models/user_model"
import EventSenderInstance from "../config/event_sender";
import { STREAMS } from "@services/common/config";
import type { EventMessage } from "@services/eventbus";
export default async function DeleteUserService(userId: string, password: string): Promise<Result<boolean>> {
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return [null, new Error("User not found")]
        }
        const storedPassword = user.password;
        const isPasswordValid = await VerifyPassword(password, storedPassword);
        if (!isPasswordValid) {
            return [null, new Error("Invalid password")]
        }
        await userModel.delete(userId);
        await EventSenderInstance.send(STREAMS.AUTH_SERVICE.USER_DELETED, { userId, timestamp: new Date().toISOString() } as EventMessage);

        return [true, null]
    } catch (error) {
        throw new Error("Error in delete user service", { cause: error })
    }
}