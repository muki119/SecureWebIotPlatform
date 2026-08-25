import type { Result } from "@services/common/types";
import {
	type ITransactionModel,
	TransactionModelInstance,
	UserRoleModelInstance,
} from "../models";
export async function GetDomainTransactionsService(
	userId: string,
	domainId: string,
	dateFrom: Date,
	dateTo?: Date,
): Promise<Result<ITransactionModel[]>> {
	// date-to is optional , jus return at max 100 transaction from datefrom
	try {
		if (!dateFrom) {
			dateFrom = new Date();
		}
		// model - find domain and user role - this is going to check if user is member aswell and the domain exists
		// if not a admin or member of domain - return not allowed
		// if not found return not found

		// if found , get trnasaction from date from to datae to if exists , otherwise return 100 trnasactionss from date from , the client will use the date from the last transaction as the next date from

		const userPermissions = await UserRoleModelInstance.userPermissions(
			userId,
			domainId,
		);
		if (!userPermissions) {
			return [
				null,
				new Error(
					"User is not a member of the domain or domain does not exist",
				),
			];
		}
		if (!userPermissions.canManageUsers) {
			// if they can manage the users and devices - means they can change domain or anything - they should be able to see the transactions
			return [
				null,
				new Error(
					"User does not have permission to view transactions in this domain",
				),
			];
		}
		const [transactions, error] =
			await TransactionModelInstance.findByDomainId(
				domainId,
				dateFrom,
				dateTo,
			);
		if (error) {
			return [null, error];
		}
		if (!transactions || transactions.length === 0) {
			return [[], null]; // return empty array if no transactions found
		}
		return [transactions, null];
	} catch (error) {
		throw new Error("Error in GetDomainTransactionsService", {
			cause: error,
		});
	}
}
