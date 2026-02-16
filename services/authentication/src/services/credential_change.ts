import type { UpdatePatch } from "../types/models";
import { User, userModel } from "../models/user_model";


export default function CredentialChangeService(changes: UpdatePatch<User>, userId: string) {
    try {
        // probably going to have to send these same changes - to the stream
        return userModel.update(userId, changes)
    } catch (error) {
        throw new Error("Error in credential change service", { cause: error })
    }

}