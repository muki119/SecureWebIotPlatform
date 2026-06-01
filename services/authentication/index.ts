import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { ErrorHandlerMiddleware, RequestMetricsMiddleware } from './src/middleware';
import { authRoutes } from './src/routes/auth_routes';
import logger from './src/config/logger';
import cookieParser from 'cookie-parser';
import { RedisClient } from './src/config/redis';
import { PostgresPool } from './src/config/postgres';
import { GetEnvNumber } from "@services/common/utilities"
import EventSenderInstance from './src/config/event_sender';
const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 100, validate: {
        trustProxy: true
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.disable('x-powered-by')
app.use(limiter);
app.use(RequestMetricsMiddleware);

app.use('/api/v1/auth', authRoutes);

app.use(ErrorHandlerMiddleware);

const Port = GetEnvNumber("PORT", 3000);
var server = app.listen(Port, async (err) => {
    EventSenderInstance.init();
    if (err) {
        await EventSenderInstance.close()
        logger.error({ error: err }, 'Error starting server:');
        process.exit(1);
    }
    logger.info(`Authentication Service is running on port ${Port}`);
});
process.on("SIGINT", () => {
    if (server) {
        server.close(async () => {
            logger.info("Authentication Service has been stopped.");

            await EventSenderInstance.close();
            if (RedisClient && RedisClient.isOpen) {
                await RedisClient.close();
            }
            await PostgresPool.end();
        });
    }
    logger.info(`Shutting down , with grace...`);
});



// for functions that require the return values to be difinitive like a hash validity check , they will return their specified values and only log the errors
// otherwise all other functions will throw errors with the original error as the cause and the caller functions will log the errors and handle them accordingly 


/**
 * Naming conventions
 * For file names - snake_case
 * for function names - non export camelcase
 * for classes - PascalCase
 * for static class functions - PascalCase
 * for non static class functions - camelCase
 * for exported functions - PascalCase
 * for variables - camelCase
 * for constants - UPPER_SNAKE_CASE
 * for types and interfaces - PascalCase
 */