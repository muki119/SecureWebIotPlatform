import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance, TransactionModelInstance, type ITransactionModel } from "../../models"
import type { ModelDTO, Role } from "@services/common/types";

export async function DomainCreatedHandler(message: EventPayload) {
    try {
        // get role info from payload
        const userRole = message?.message;
        if (!userRole || typeof userRole === "string" || !userRole.userId || !userRole.domainId || !userRole.role) {
            throw new Error("No user role information in payload");
        }
        await UserRoleModelInstance.create({ userId: userRole.userId, domainId: userRole.domainId, role: userRole.role as Role }) // create the new role in the database
        const transactionObj: ModelDTO<ITransactionModel> = {
            domainId: userRole.domainId,
            initiatorId: userRole.userId,
            opperationTarget: "DOMAIN",
            opperationType: "CREATE",
            targetId: userRole.domainId, // since the domain is the target of the creation
            value: null,
            opperationTimestamp: new Date()
        }
        const [_, err] = await TransactionModelInstance.create(transactionObj)
        if (err) {
            throw err
        }
        return;
    } catch (error) {
        throw new Error("Failed to process domain created event", { cause: error });
    }
}