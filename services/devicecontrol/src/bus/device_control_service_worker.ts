import { STREAMS } from "@services/common/config";
import { RecursiveError } from "@services/common/utilities";
import { BaseWorker } from "@services/eventbus";
import { logger } from "../config";
import {
	DomainDeletedHandler,
	DomainUserAddedHandler,
	DomainUserRemovedHandler,
	DomainUserRoleUpdatedHandler,
	UserDeletedHandler,
} from "./handlers";
export class DeviceControlServiceWorker extends BaseWorker {
	onCreate() {
		this.handler(
			STREAMS.DOMAIN_SERVICE.DOMAIN_CREATED,
			DomainUserAddedHandler,
		); // only has to create a user role for domain owner
		this.handler(
			STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ADDED,
			DomainUserAddedHandler,
		); // should create a user role with the information
		this.handler(
			STREAMS.DOMAIN_SERVICE.DOMAIN_USER_REMOVED,
			DomainUserRemovedHandler,
		); // should delete the user role
		this.handler(
			STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED,
			DomainUserRoleUpdatedHandler,
		); // should update the user role with the new information
		this.handler(STREAMS.AUTH_SERVICE.USER_DELETED, UserDeletedHandler); // should delete the user role
		this.handler(
			STREAMS.DOMAIN_SERVICE.DOMAIN_DELETED,
			DomainDeletedHandler,
		); // should notify clients that the domain has been deleted
		this.errorHandler((error, payload) => {
			logger.error(
				{ ...RecursiveError(error), payload },
				"Error in DeviceControlServiceWorker:",
			);
		});
	}
}

const worker = new DeviceControlServiceWorker();
worker.start(); // this is the only way for the parent process to start the worker and begin communicating
