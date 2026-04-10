import type { Socket } from "socket.io";
import { UserRoleModelInstance } from "../models";
import { SOCKET_EVENTS } from "../constants/";
import { DeviceControlUpdateHandler } from "../handlers/socket";



export async function SocketRoutes(socket: Socket) {

    const userId = (socket as any).user?.sub; // jwt payload sub is user id 
    const userDomains = await UserRoleModelInstance.findByUserId(userId);
    const rooms = userDomains.map(role => role.domainId as string).concat(userId); // also join a room for the user id - for sending user specific notifications like role updates, token expiry etc;

    socket.join(rooms); // join all the users domain

    socket.on(SOCKET_EVENTS.CLIENT_EMITTED.DEVICE_CONTROL.UPDATE, (data, callback) => DeviceControlUpdateHandler(socket, data, callback)) // handle device control updates from clients - this is when a user tries to control a device (ie update a capability) - this will check permissions, update the device state in the database, send the command to the device via mqtt and notify other clients in the domain of the change so they can update their UI in real time

    // first connect to all the rooms - which is just the domainId's
}