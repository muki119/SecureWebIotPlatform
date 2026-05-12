import express from 'express';
import { GetEnvNumber } from '@services/common/utilities';
import cookieParser from 'cookie-parser';
import { LedgerRouter } from './src/routes';
import { logger, EventBusInstance } from './src/config';
import { ErrorHandlerMiddleware } from './src/middleware';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.disable('x-powered-by')


app.use('/api/v1', LedgerRouter);
app.use(ErrorHandlerMiddleware);
const port = GetEnvNumber('PORT', 3000);

const server = app.listen(port, async (err) => {
    if (err) {
        logger.error({ error: err }, 'Error starting server:');
        process.exit(1);
    }
    await EventBusInstance.init();
    await EventBusInstance.start();
    logger.info('Event bus started');
    logger.info(`Listening on port ${port}`)
});



const shutdown = () => {
    logger.info("Shutting down")
    server.close(async (err) => {
        if (err) {
            logger.error({ error: err }, 'Error closing server:');
            process.exit(1);
        }
        await EventBusInstance.stop();
        logger.info("Server closed")
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
