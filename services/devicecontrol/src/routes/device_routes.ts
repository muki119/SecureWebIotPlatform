import { DomainIdOnlyValidator } from "@services/common/validators";
import { Router } from "express";
import {
	AddDeviceController,
	CreatePairingCodeController,
	DeleteDeviceController,
	GetDeviceTelemetryController,
	GetDomainDevicesController,
	UpdateDeviceController,
} from "../controllers";
import { ValidSessionMiddleware } from "../middleware";
import {
	AddDeviceValidator,
	DeviceValidator,
} from "../validators/device_validator";

/**
 * for adding device - POST /device/activate
 * for creating pairing code - POST /device/:domainId/pair
 * for getting devices in domain - GET /device/domain/:domainId
 * for deleting device - DELETE /device/:deviceId
 * for updating device - PATCH /device/:deviceId
 * for getting device telemetry - GET /device/:deviceId/telemetry?capability=&interval=&from=
 */

const DeviceRouter = Router(); // all under /api/v1/device

DeviceRouter.post("/activate", AddDeviceValidator, AddDeviceController); // called by device - dosent need session middleware
DeviceRouter.post(
	"/domain/:domainId/pair",
	ValidSessionMiddleware,
	DomainIdOnlyValidator,
	CreatePairingCodeController,
);
DeviceRouter.get(
	"/domain/:domainId",
	ValidSessionMiddleware,
	DomainIdOnlyValidator,
	GetDomainDevicesController,
);
DeviceRouter.delete(
	"/:deviceId",
	ValidSessionMiddleware,
	DeviceValidator,
	DeleteDeviceController,
);
DeviceRouter.patch(
	"/:deviceId",
	ValidSessionMiddleware,
	DeviceValidator,
	UpdateDeviceController,
);
DeviceRouter.get(
	"/:deviceId/telemetry",
	ValidSessionMiddleware,
	DeviceValidator,
	GetDeviceTelemetryController,
);

export { DeviceRouter };
