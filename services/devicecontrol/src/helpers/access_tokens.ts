import { CreateVerifyAccessTokenInstance } from "@services/common/helpers";
import { logger } from "../config/";

export const VerifyAccessToken = CreateVerifyAccessTokenInstance(logger);
