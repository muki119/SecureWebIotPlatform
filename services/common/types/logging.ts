export type LogError = {
	name: string;
	message: string;
	cause?: LogError;
};
