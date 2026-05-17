


export const SOCKET_EVENTS = {

    CLIENT_EMITTED: {
        DEVICE_CONTROL: { // client emitted
            UPDATE: "DEVICE_CONTROL_UPDATE" // this is emitted to the device when a user updates capability  of a device (ie is controlling something ) - should follow {deviceId,domainId, changes:{capability:string, value:any} } // has to be debounced on client so micro changes dont kill backend  - might have to be acked
        }
    },

    SERVER_EMITTED: { // most/all of these events are emitted to rooms without ack because they are to be real time and ack isnt necessary and isnt performant
        DOMAIN: { // these events are emitted to the room  , all follows {domainid ,userid} // server emitted
            USER_REMOVED: "DOMAIN_USER_REMOVED", // WHEN A USER other than yourself is removed from a domain , just send the user id , the domain id is from the room they are in
            USER_ADDED: "DOMAIN_USER_ADDED", // {domainid, userid} when a user is added to a domain
            USER_ROLE_UPDATED: "DOMAIN_USER_ROLE_UPDATED",
        },
        DEVICE: { // this isnt a room but is emitted under the domains , needs to follow {domainid , deviceid} - this is server emitted
            ADDED: "DEVICE_ADDED",//{domainid, deviceid , the device details}
            REMOVED: "DEVICE_REMOVED", // {domainid, deviceid}
            DEVICE_INFO_UPDATED: "DEVICE_INFO_UPDATED", // when device information like name or location is updated , this is emitted with {domainid, deviceid, changes:{name?:string, location?:string} }
            UPDATED: "DEVICE_UPDATED", // shoudld probably follow the patch pattern of {capability:string , value:any}  so , {deviceId, changes:{capability:string, value:any} } // this is when a user updates a device capability and this is what the server sends to the clients in the domain - should be broadcasted
            TELEMETRY: "DEVICE_TELEMETRY", // is just {domainid, deviceId, data:{capability:string, value:any} }-  emitted when a device sends new telemetry data
            STATUS: "DEVICE_STATUS", // is just {domainid, deviceId, data:{status:string} }- emitted when a device status changes
        },
        USER: { // user will connect to its own room which is its userid , needs to only folow {userid,domainid} // server emitted
            JOINED_DOMAIN: "USER_JOINED_DOMAIN", // when a user is added to a domain
            LEFT_DOMAIN: "USER_LEFT_DOMAIN", // when removed from a domain
            ROLE_UPDATED: "USER_ROLE_UPDATED", // when role is updated in a domain
        },

    }
}