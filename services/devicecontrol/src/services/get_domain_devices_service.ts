import type { ServiceResult } from "@services/common/types";
import { DeviceModelInstance, UserRoleModelInstance } from "../models";
import type { IDevice } from "../types";

export async function GetDomainDevicesService(
	userId: string,
	domainId: string,
): Promise<ServiceResult<IDevice[]>> {
	try {
		const userIsMember = await UserRoleModelInstance.isMember(
			userId,
			domainId,
		);
		if (!userIsMember) {
			return [null, new Error("User is not a member of domain")];
		}
		// Proceed to fetch devices for the domain
		const [devices, err] =
			await DeviceModelInstance.findByDomainId(domainId);
		if (err) {
			return [null, err]; // return errors are usually user input errors and are friendly for frontend error messages
		}
		return [devices, null];
	} catch (error) {
		throw new Error("Error in getting domain devices service", {
			cause: error,
		});
	}
}
