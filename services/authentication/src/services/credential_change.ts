import type { UpdatePatch } from "@services/common/types";
import { type IUser, userModel } from "../models/user_model";
import type { ServiceResult } from "../types/service";
import EventSenderInstance from "../config/event_sender";
import { STREAMS } from "@services/common/config";
export default async function CredentialChangeService(changes: UpdatePatch<IUser>, userId: string): Promise<ServiceResult> {
    try {
        // probably going to have to send these same changes - to the stream
        const [updatedItem, error] = await userModel.update(userId, changes) // changes to be sent to stream for other services to apply neccessary changes
        if (error) {
            return { success: false, message: error.message }
        }
        if (!updatedItem) { // if theres no updated item (somehow) then should probably return an error since this shouldnt be happening since unsuccessful has already been handled
            throw new Error("Update was successful but no updated item was returned")
        }
        await EventSenderInstance.send(STREAMS.AUTH_SERVICE.USER_UPDATED, {
            id: userId,
            changes: JSON.stringify(changes),
            timestamp: new Date().toISOString()
        })
        return { success: true, user: updatedItem }

    } catch (error) {
        throw new Error("Error in credential change service", { cause: error })
    }

}