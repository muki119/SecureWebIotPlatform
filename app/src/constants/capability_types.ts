export const CapabilityTypes = {
	BINARY: "BINARY", // on or off
	RANGE: "RANGE", // a range of values - like a slider
	GAUGE: "GAUGE", // a value that can be read but not set - like a sensor reading
	ENUM: "ENUM", // a value that can be set to one of a predefined set of values - like a dropdown
	COLOR: "COLOR", // a value that can be set to a color - like a color picker
} as const;
