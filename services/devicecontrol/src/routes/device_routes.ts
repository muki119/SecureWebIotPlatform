import { Router } from "express";
import { ValidSessionMiddleware } from "../middleware";
import {
    AddDeviceController, CreatePairingCodeController,
    GetDeviceTelemetryController, DeleteDeviceController,
    GetDomainDevicesController, UpdateDeviceController
} from "../controllers"
/**
 * for adding device - POST /device/activate
 * for creating pairing code - POST /device/:domainId/pair
 * for getting devices in domain - GET /device/domain/:domainId
 * for deleting device - DELETE /device/:deviceId
 * for updating device - PATCH /device/:deviceId
 * for getting device telemetry - GET /device/:deviceId/telemetry?capability=&interval=&from=
 */


const DeviceRouter = Router(); // all under /api/v1/device

DeviceRouter.post("/activate", AddDeviceController) // called by device - dosent need session middleware
DeviceRouter.post("/domain/:domainId/pair", ValidSessionMiddleware, CreatePairingCodeController)
DeviceRouter.get("/domain/:domainId", ValidSessionMiddleware, GetDomainDevicesController)
DeviceRouter.delete("/:deviceId", ValidSessionMiddleware, DeleteDeviceController)
DeviceRouter.patch("/:deviceId", ValidSessionMiddleware, UpdateDeviceController)
DeviceRouter.get("/:deviceId/telemetry", ValidSessionMiddleware, GetDeviceTelemetryController)

export { DeviceRouter }