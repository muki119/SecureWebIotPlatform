import { BaseWorker, MessageFlags } from "@services/eventbus";
import { STREAMS } from "@services/common/config";
import { UserCreatedHandler, UserDeletedHandler, UserUpdatedHandler } from "./handlers";
import logger from "../config/logger";
export class DomainServiceWorker extends BaseWorker {
    onCreate() {
        this.handler(STREAMS.AUTH_SERVICE.USER_CREATED, UserCreatedHandler) // should create a profile with the information 
        this.handler(STREAMS.AUTH_SERVICE.USER_DELETED, UserDeletedHandler) // should delete the profile and all associated data (devices, etc)
        this.handler(STREAMS.AUTH_SERVICE.USER_UPDATED, UserUpdatedHandler) // should update the profile with the new information (if email is updated, should update email in profile, etc) -- mostly just an email update since display names are sep
        this.errorHandler((error, payload) => {
            logger.error({ error, payload }, "Error in DomainServiceWorker:");
        })
    }

}

const worker = new DomainServiceWorker();
worker.start(); // this is the only way for the parent process to start the worker and begin communicating