import { CreateVerifyAccessTokenInstance } from "@services/common/helpers"
import Logger from "../config/logger";

export const VerifyAccessToken = CreateVerifyAccessTokenInstance(Logger);