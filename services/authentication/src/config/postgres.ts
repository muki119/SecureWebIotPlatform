import { ConnectToServicePostgres } from "@services/common/config";
import logger from "./logger";

export const PostgresPool = await ConnectToServicePostgres(
	"authentication_service",
	logger,
);
