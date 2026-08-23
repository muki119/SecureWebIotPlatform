import { checkSchema } from "express-validator";

export const DeviceValidator = checkSchema({
	deviceId: {
		in: "params",
		isString: true,
		isUUID: { options: 4 },
		notEmpty: true,
		errorMessage: "Device ID is required",
	},
});

export const AddDeviceValidator = checkSchema({
	code: {
		in: "body",
		isString: true,
		notEmpty: true,
		errorMessage: "Pairing code is required",
	},
	deviceInfo: {
		in: "body",
		isObject: true,
		notEmpty: true,
		errorMessage: "Device info is required",
	},
});
