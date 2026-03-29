import { userModel, type IUser } from "../models/user_model";
import { HashPassword } from "../utilities/password_hash";
import type { ModelDTO } from "@services/common/types";
import type { ServiceResult } from "../types/service";
import EventSenderInstance from "../config/event_sender";
import { STREAMS } from "@services/common/config";
export default async function RegisterService(user: ModelDTO<IUser>): Promise<ServiceResult> {
    try {

        const existingUser = await userModel.existsByEmail(user.email)
        if (existingUser) {
            return { success: false, message: "Email already in use" }
        }

        const passwordHash = await HashPassword(user.password)
        user.password = passwordHash
        userModel.multiTableTransaction(async (conn) => { // make sure the user is created and the event is sent before committing
            const createdUser = await userModel.create(user, conn) // will be used to send to stream for record creation in other services- like the domain service - to be added
            await EventSenderInstance.send(STREAMS.AUTH_SERVICE.USER_CREATED, {
                id: createdUser.id,
                name: `${createdUser.forename} ${createdUser.surname.charAt(0)}`,
                email: createdUser.email,
                timestamp: new Date().toISOString()
            })
        })

        // send id email and full name to stream for record creation in other services- like the domain service 
        return { success: true, }
    } catch (error) {
        throw new Error("Error in register service", { cause: error })
    }
}