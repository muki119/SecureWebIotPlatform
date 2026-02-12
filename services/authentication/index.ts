import express from 'express';
import errorHandler from './src/middleware/error_handler';
import session from 'express-session';
import { authRoutes } from './src/routes/auth_routes';
import { logger } from './src/config/logger';
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    name: "auth.sid",
    secret: "To be replaced with key from vault probably",
    saveUninitialized: false,
    resave: true,
    cookie: {
        httpOnly: true,
        sameSite: "lax",

    }


}))

app.use('/auth/v1', authRoutes);

app.use(errorHandler);

var server = app.listen(3000, () => {
    logger.info("Authentication Service is running on port 3000");
});
process.on("SIGINT", () => {
    if (server) {
        server.close(() => {
            logger.info("Authentication Service has been stopped.");
            process.exit(0);
        });
    }
    logger.info(`Shutting down , with grace...`);
});



// for functions that require the return values to be difinitive like a hash validity check , they will return their specified values and only log the errors
// otherwise all other functions will throw errors with the original error as the cause and the caller functions will log the errors and handle them accordingly 
