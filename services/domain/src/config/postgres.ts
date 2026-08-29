import { ConnectToServicePostgres } from "@services/common/config";
import logger from "./logger";

export const PostgresPool = await ConnectToServicePostgres(
	"domain_service",
	logger,
);
