import { type ServiceResult } from "@services/common/types";
import { DomainModelInstance, UserDomainModelInstance, UserRoleModelInstance, ROLES, type IDomain, type IUserDomain, } from "../../models";
export default async function CreateDomainService(domainName: string, userID: string): Promise<ServiceResult<{ domain: IDomain, userDomain: IUserDomain }>> {
    try {
        const result = await DomainModelInstance.multiTableTransaction(async (conn) => {
            const newDomain = await DomainModelInstance.create({ name: domainName, ownerId: userID }, conn) // create a new domain
            const userDomain = await UserDomainModelInstance.create({ userId: userID, domainId: newDomain.id }, conn) // create a new user-domain relationship
            await UserRoleModelInstance.create({ userId: userID, domainId: newDomain.id, role: ROLES.OWNER }, conn) // create a new user-role relationship with the role of owner
            return { domain: newDomain, userDomain }
        })
        if (!result || !result.domain || !result.userDomain) {
            throw new Error("Failed to create domain") // SHOULD NOT EVER HAPPEN
        }
        return [result, null]
    } catch (error) {
        throw new Error("Error in CreateDomainService", { cause: error })
    }
}