


//streams > actions

export const CONSUMER_GROUPS = {
    AUTH_SERVICE: "AUTH_SERVICE",
    DOMAIN_SERVICE: "DOMAIN_SERVICE",
    DEVICE_SERVICE: "DEVICE_SERVICE",
    LEDGER_SERVICE: "LEDGER_SERVICE",
} as const;


export const STREAMS = { // streams instead of actions because certain services only need to listen to certain streams
    AUTH_SERVICE: {
        USER_CREATED: "AUTH_SERVICE.USER_CREATED",
        USER_DELETED: "AUTH_SERVICE.USER_DELETED",
        USER_UPDATED: "AUTH_SERVICE.USER_UPDATED",
    },
    DOMAIN_SERVICE: {
        DOMAIN_CREATED: "DOMAIN_SERVICE.DOMAIN_CREATED",
        DOMAIN_DELETED: "DOMAIN_SERVICE.DOMAIN_DELETED",
        DOMAIN_UPDATED: "DOMAIN_SERVICE.DOMAIN_UPDATED",
    },
    DEVICE_SERVICE: {
        DEVICE_CREATED: "DEVICE_SERVICE.DEVICE_CREATED",
        DEVICE_DELETED: "DEVICE_SERVICE.DEVICE_DELETED",
        DEVICE_UPDATED: "DEVICE_SERVICE.DEVICE_UPDATED",
    },
    LEDGER_SERVICE: {
        ENTRY_CREATED: "LEDGER_SERVICE.ENTRY_CREATED",
    }
} as const;

//Auth - nothing to listen to
// domain - listen for auth service
// device - listen for auth service, domain service
// ledger - listen for auth service, domain service, device service -- mainly domain and device since they trigger events that require ledger entries to be made. 