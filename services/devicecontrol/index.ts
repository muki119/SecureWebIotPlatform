import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { DeviceRouter, MqttRoutes, SocketRoutes } from "./src/routes";
import { ErrorHandler, ValidSocketSessionMiddleware } from "./src/middleware";
import { logger } from "./src/config";
import { GetEnvNumber } from "@services/common/utilities";
import EventBusInstance from "./src/config/event_bus";
import express from "express";
import { app, httpServer, io } from "./src/config/";

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
app.use('/api/v1/device', DeviceRouter);
app.use(ErrorHandler);

io.use(ValidSocketSessionMiddleware)
io.on("connection", SocketRoutes);

const port = GetEnvNumber('PORT', 2558);
const server = httpServer.listen(port, async () => {
    logger.info(`Listening on port ${port}`)
    await EventBusInstance.init();
    await EventBusInstance.start();
    MqttRoutes();
    logger.info('Event bus started');
});
server.on('error', (e) => {
    if (e.message === 'EADDRINUSE') {
        logger.error('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(port);
        }, 1000);
    }
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


/**
 * routes
 * getdomain devices
 * create pairing code for device 
 * remove device from domamin
 * update device details
 * 
 * 
 * iot device onbaording process
 * user creates device pairing code thorough the platform
 * user connects device to the platform using the pairing code
 * device is added to the users domain - this change is sent to the ledger service
 * device is sent a token as authentication when using the platform
 * device then uses mqtt to send data to platform and is controleld through meduium
 * 
 * devices send data on ticks or when its values change - like a change in temperature or toggle of a switch
 *  
 */

/**
 * this service tables / collections
 * going to be using mongo - might not need join tables 
 * roles table - sent from domain service 
 * devices table
 * 
 */


/**
 * Devices Collection Schema -- might need a time series collection for current device data - might add a ttl so that data dosent build up too much  - might also need to 
 * device_id: string (uuid)
 * domain_id: string (uuid) 
 * name:string
 * last_online:Date
 * role_whitelist: string[] // allowed roles that can control
 * capabilites:[// example
 *  {Label:"temperature" , type:"guage" , metric: "celsius"  , min: -50 , max: 150 } // the types imply interactivity  , - guage in this example is probably read only 
 *  {Label:"on_off" , type:"binary" , metric: "boolean" } // binary probably toggle
 *  {Label:"brightness" , type:"range" , metric: "percentage"  , min: 0 , max: 100 }
 * ]
 * 
 * created_by: string (uuid)
 * created_at: Date
 * updated_at: Date
 * deleted_at: Date | null
 * 
 */

/**
 * Device data
 * should either store current device data / state or  have individual entries for each state change for each field
 * might have to be a current state collection because it allows easier pulling of current device state for frontend and it probably wont be that bad to analyse if there was a histogram or time series graph
 * 
 * current device state collection schema
 * device_id: string (uuid)
 * domain_id: string (uuid)
 * data: { [label: string]: any } 
 * timestamp: Date
 */

/**
 * Actually will have a current state collection and a device data collection with a ttl
 * the current state collection wont make new entries for each state change , just updates the current state of the device record with new data and a time stamp
 * the device data collection will have an entry for every change - this is for time series analysis 
 */


/**
 * capability types - mirrors heavily with html input types - since i can implement them alot easier 
 * guage - read only 
 * binary - toggle
 * range - can set value within a range 
 * enum - can set value to one of a predefined set of values
 */


/**
 * Going to strictly enforce error as values in this service
 */