import type { EventPayload } from "@services/eventbus";
import { UserRoleModelInstance, TransactionModelInstance, type ITransactionModel } from "../../models"
import type { ModelDTO, Role } from "@services/common/types";
export async function DomainUserRemovedHandler(message: EventPayload) {
    try {
        const userDomainInfo = message?.message;
        if (!userDomainInfo || typeof userDomainInfo === "string" || !userDomainInfo.userId || !userDomainInfo.domainId) {
            throw new Error("No user domain information in payload");
        }
        await UserRoleModelInstance.delete(userDomainInfo.userId, userDomainInfo.domainId) // delete the role associated with the deleted user in the database - this is necessary to ensure that if the user is re-added to the domain later, they don't have any lingering permissions from their previous membership

        const transactionObj: ModelDTO<ITransactionModel> = {
            domainId: userDomainInfo.domainId,
            initiatorId: userDomainInfo.initiatorId!,
            opperationTarget: "DOMAIN_USER"
            , opperationType: "DELETE",
            targetId: userDomainInfo.userId,
            value: null,
            opperationTimestamp: message.message.timestamp ? new Date(message.message.timestamp) : new Date()
        }
        const [_, err] = await TransactionModelInstance.create(transactionObj)
        if (err) {
            throw err
        }
        return;
    } catch (error) {
        throw new Error("Failed to process domain user removed event", { cause: error });
    }
}