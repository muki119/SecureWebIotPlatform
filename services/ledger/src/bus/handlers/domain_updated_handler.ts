import type { ModelDTO } from "@services/common/types";
import type { EventPayload } from "@services/eventbus";
import { type ITransactionModel, TransactionModelInstance } from "../../models";

export async function DomainUpdatedHandler(message: EventPayload) {
	try {
		if (!message?.message) {
			throw new Error("No message in payload");
		}
		const updatePayload = message.message;
		if (
			!updatePayload ||
			typeof updatePayload === "string" ||
			!updatePayload.domainId ||
			!updatePayload.initiatorId ||
			!updatePayload.changes
		) {
			throw new Error("No domain information in payload");
		}
		const transactionObj: ModelDTO<ITransactionModel> = {
			domainId: updatePayload.domainId,
			initiatorId: updatePayload.initiatorId,
			opperationTarget: "DOMAIN",
			opperationType: "UPDATE",
			targetId: updatePayload.domainId,
			value: { changes: JSON.parse(updatePayload.changes as string) },
			opperationTimestamp: updatePayload.timestamp
				? new Date(updatePayload.timestamp)
				: new Date(),
		};
		const [_, err] = await TransactionModelInstance.create(transactionObj);
		if (err) {
			throw err;
		}
		return;
	} catch (error) {
		throw new Error("Failed to process domain updated event", {
			cause: error,
		});
	}
}
