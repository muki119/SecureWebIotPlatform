import type { Logger } from "pino";
export default abstract class MiddlewareBaseClass {
	protected logger: Logger;
	constructor(logger: Logger) {
		this.logger = logger;
	}
	// middleware should only modify the request and response objects at most , not return any value
	public abstract middleware: Promise<void> | void;
}
