import type { EventPayload } from "@services/eventbus";
import { TransactionModelInstance, type ITransactionModel } from "../../models"
import type { ModelDTO } from "@services/common/types";
export async function DeviceUpdatedHandler(message: EventPayload) {
    try {
        const deviceInfo = message?.message;
        if (!deviceInfo || typeof deviceInfo === "string" || !deviceInfo.deviceId || !deviceInfo.domainId) {
            throw new Error("No device information in payload");
        }
        const transactionObj: ModelDTO<ITransactionModel> = {
            domainId: deviceInfo.domainId,
            initiatorId: deviceInfo.initiatorId!,
            opperationTarget: "DEVICE",
            opperationType: "UPDATE",
            targetId: deviceInfo.deviceId,
            value: JSON.parse(deviceInfo.changes as string),
            opperationTimestamp: message.message.timestamp ? new Date(message.message.timestamp) : new Date()
        }
        const [_, err] = await TransactionModelInstance.create(transactionObj)
        if (err) {
            throw err
        }
        return;
    } catch (error) {
        throw new Error("Failed to process device updated event", { cause: error });
    }
}