// these utils are just simple helper functions for checking the readieness of common functions like db models and some other services

type ReadyCheckable = {
	ready: boolean | Promise<boolean>;
};
export function CheckPostgresModelReady(
	model: ReadyCheckable,
): Promise<boolean> {
	return Promise.resolve(model.ready);
}

export function CheckMongoModelReady(model: ReadyCheckable): Promise<boolean> {
	return Promise.resolve(model.ready);
}
