import type { ModelDTO, Role } from "@services/common/types";
import type { EventPayload } from "@services/eventbus";
import {
	type ITransactionModel,
	TransactionModelInstance,
	UserRoleModelInstance,
} from "../../models";
export async function DomainUserAddedHandler(message: EventPayload) {
	try {
		// get role info from payload
		const userRole = message?.message;
		if (
			!userRole ||
			typeof userRole === "string" ||
			!userRole.userId ||
			!userRole.domainId ||
			!userRole.role ||
			!userRole.initiatorId
		) {
			throw new Error("No user role information in payload");
		}
		const roleObj = {
			userId: userRole.userId,
			domainId: userRole.domainId,
		};
		await UserRoleModelInstance.create({
			...roleObj,
			role: userRole.role as Role,
		}); // create the new role in the database
		const transactionObj: ModelDTO<ITransactionModel> = {
			domainId: userRole.domainId,
			initiatorId: userRole.initiatorId,
			opperationTarget: "DOMAIN_USER",
			opperationType: "CREATE",
			targetId: userRole.userId,
			value: { role: userRole.role },
			opperationTimestamp: message.message.timestamp
				? new Date(message.message.timestamp)
				: new Date(),
		};
		const [_, err] = await TransactionModelInstance.create(transactionObj);
		if (err) {
			throw err;
		}
	} catch (error) {
		throw new Error("Failed to process domain user added event", {
			cause: error,
		});
	}
}
