import type { EventPayload } from "@services/eventbus";
import { TransactionModelInstance, type ITransactionModel } from "../../models"
import type { ModelDTO, Role } from "@services/common/types";

export async function DomainUpdatedHandler(message: EventPayload) {
    try {
        const updatePayload = message?.message!;
        const transactionObj: ModelDTO<ITransactionModel> = {
            domainId: updatePayload.domainId!,
            initiatorId: updatePayload.initiatorId!,
            opperationTarget: "DOMAIN",
            opperationType: "UPDATE",
            targetId: updatePayload.domainId!,
            value: { changes: JSON.parse(updatePayload.changes as string) },
            opperationTimestamp: updatePayload.timestamp ? new Date(updatePayload.timestamp) : new Date()
        }
        const [_, err] = await TransactionModelInstance.create(transactionObj)
        if (err) {
            throw err
        }
        return;
    } catch (error) {
        throw new Error("Failed to process domain updated event", { cause: error });
    }
}