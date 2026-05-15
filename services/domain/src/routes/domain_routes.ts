import {
    CreateDomainController,
    DeleteDomainController,
    UpdateDomainController,
    GetUserDomainsController,
    GetDomainUsersController,
    AddUserController,
    DeleteUserController,
    UpdateUserRoleController,
    LeaveDomainController,
    UpdateOwnerController
} from "../controllers/domain_controllers"
import { Router } from "express";


/**
 * Domain
 * /domain post - creates domain
 * /domain/:domainId PATCH [{field: string, value: string}] - updates domain
 * /domain/:domainId DELETE -- uses userid to check user has permission to delete domain - checks if owner role - deletes domain 
 * /domain/:domainId/user POST - body {userId: string, role: string} -- uses userid to check user has permission to add user to domain - adds user
 * /domain/:domainId/user/:userid DELETE - body -- uses userid to check user has permission to remove user from domain - removes user
 * /domain/:domainId/user/:userid/role Patch - changes user role - admin+ only
 * /domain/:domainId/users/ GET -- might need pagination if there are a lot of users - will return max 100 at a time , sorted by date joined by default 
 * /domain?offset=&limit= <100 GET - uses access token to get user id - gets all the users domains - paginated - will 100% be compressed
* could potentially have a undo domain deletion  - requires getting all join table entries where the deleted_at time is at or after the time in the domain table entry 
*/

const DomainRouter = Router();
//the parent route is domain
DomainRouter.post("/", CreateDomainController); // Creates a domain
DomainRouter.patch("/:domainId", UpdateDomainController); // Updates a domain - owner only
DomainRouter.delete("/:domainId", DeleteDomainController); // Deletes a domain - owner only

DomainRouter.post("/:domainId/leave", LeaveDomainController); // leave a domain
DomainRouter.post("/:domainId/user", AddUserController); // Adds a user to a domain - admin+ only
DomainRouter.patch("/:domainId/transfer-ownership", UpdateOwnerController); // changes domain owner but sets old owner to admin - owner only

DomainRouter.delete("/:domainId/user/:userId", DeleteUserController); // Removes a user from domain - admin+ only
DomainRouter.patch("/:domainId/user/:userId/role", UpdateUserRoleController); // Updates a users role in a domain - admin+ only

DomainRouter.get("/:domainId/users", GetDomainUsersController); // Gets all users in a domain
DomainRouter.get("/", GetUserDomainsController); // Gets all domains for a user - paginated with ?limit= & offset=

export default DomainRouter;