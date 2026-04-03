import { type Logger } from "pino";
export default abstract class MiddlewareBaseClass {
    protected logger: Logger;
    constructor(logger: Logger) {
        this.logger = logger;
    }
    public abstract middleware: Promise<any> | any;
}