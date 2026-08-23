import { SessionMiddleware } from "@services/common/middleware";
import logger from "../config/logger";

const ValidSessionMiddleware = new SessionMiddleware(logger).middleware;
export default ValidSessionMiddleware;
