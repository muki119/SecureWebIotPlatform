import type { ServiceResult } from "@services/common/types";
import { DeviceModelInstance, UserRoleModelInstance } from "../models";
import type { IDevice } from "../types";

export async function GetDomainDevicesService(
	userId: string,
	domainId: string,
): Promise<ServiceResult<IDevice[]>> {
	try {
		const [userIsMember, userIsMemberErr] =
			await UserRoleModelInstance.isMember(userId, domainId);
		if (userIsMemberErr) {
			return [null, userIsMemberErr];
		}
		if (!userIsMember) {
			return [null, new Error("User is not a member of domain")];
		}
		// Proceed to fetch devices for the domain
		const [domainDevices, domainDevicesErr] =
			await DeviceModelInstance.findByDomainId(domainId);
		if (domainDevicesErr) {
			return [null, domainDevicesErr]; // return errors are usually user input errors and are friendly for frontend error messages
		}
		return [domainDevices, null];
	} catch (error) {
		throw new Error("Error in getting domain devices service", {
			cause: error,
		});
	}
}
