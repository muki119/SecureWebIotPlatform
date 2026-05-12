import { BaseWorker } from "@services/eventbus";
import { RecursiveError } from "@services/common/utilities";
import { STREAMS } from "@services/common/config";
import { DeviceCreatedHandler, DeviceDeletedHandler, DeviceUpdatedHandler, DomainCreatedHandler, DomainUpdatedHandler, DomainUserAddedHandler, DomainUserRemovedHandler, DomainUserRoleUpdatedHandler, UserDeletedHandler } from "./handlers";
import { logger } from "../config"
export class DomainServiceWorker extends BaseWorker {
    onCreate() {
        this.handler(STREAMS.DEVICE_SERVICE.DEVICE_CREATED, DeviceCreatedHandler);
        this.handler(STREAMS.DEVICE_SERVICE.DEVICE_DELETED, DeviceDeletedHandler);
        this.handler(STREAMS.DEVICE_SERVICE.DEVICE_UPDATED, DeviceUpdatedHandler);
        this.handler(STREAMS.DOMAIN_SERVICE.DOMAIN_CREATED, DomainCreatedHandler);
        this.handler(STREAMS.DOMAIN_SERVICE.DOMAIN_UPDATED, DomainUpdatedHandler);
        this.handler(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ADDED, DomainUserAddedHandler);
        this.handler(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_REMOVED, DomainUserRemovedHandler);
        this.handler(STREAMS.DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED, DomainUserRoleUpdatedHandler);
        this.handler(STREAMS.AUTH_SERVICE.USER_DELETED, UserDeletedHandler);
        this.errorHandler((error, payload) => {
            logger.error({ ...RecursiveError(error), payload }, "Error in DomainServiceWorker:");
        })
    }

}

const worker = new DomainServiceWorker();
worker.start(); // this is the only way for the parent process to start the worker and begin communicating