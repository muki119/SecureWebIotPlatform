export type DeviceControlUpdateData = {
	deviceId: string;
	domainId: string;
	changes: {
		capability: string;
		value: string | number | boolean;
	};
};
