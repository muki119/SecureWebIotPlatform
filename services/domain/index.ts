import express from 'express';
import { GetEnvNumber, GetEnvString } from '../common/utilities/getEnv';
import cookieParser from 'cookie-parser';
import Domain_ProfileRouter from './src/routes';


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.disable('x-powered-by')


app.use('/api/v1', Domain_ProfileRouter);
const port = GetEnvNumber('PORT', 3000);

const server = app.listen(port, (err) => {
    if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
    console.log(`Listening on port ${port}`)
});



const shutdown = () => {
    console.log("Shutting down")
    server.close((err) => {
        if (err) {
            console.error('Error closing server:', err);
            process.exit(1);
        }
        console.log("Server closed")
        process.exit(0);
    });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


/**
 * Profile creation - event bus service
 * Domain and user management stuff will all be api routes
 * 
 * Domain management:
 * - Create domain
 * - Update domain name
 * - Delete domain
 * - Add user to domain
 * - Remove user from domain
 * - List users in domain
 * - List domains for user
 * 
 * User Role management:
 * - Create role - by default , if not user then role is member 
 * - Update user role - can only change role
 * - Get role - happens in services that need to check permissions - like domain mangement
 * - Role deletion comes when user is removed from domain 
 */

/**
 * Domain
 * /domain post - creates domain
 * /domain/:domainId PATCH [{field: string, value: string}] - updates domain
 * /domain/:domainId DELETE -- uses userid to check user has permission to delete domain - checks if owner role - deletes domain 
 * /domain/:domainId/user POST - body {userId: string, role: string} -- uses userid to check user has permission to add user to domain - adds user
 * /domain/:domainId/user/:userid DELETE - body -- uses userid to check user has permission to remove user from domain - removes user
 * /domain/:domainId/user/:userid/role Patch - changes user role - admin+ only
 * /domain/:domainId/users/ GET -- might need pagination if there are a lot of users - will return max 100 at a time , sorted by date joined by default 
 * /domain?offset=&limit= <100 GET - uses access token to get user id - gets all the users domains - paginated - will 100% be compressed
* could potentially have a undo domain deletion  - requires getting all join table entries where the deleted_at time is at or after the time in the domain table entry 
*/

/**
 * Profile
 * - create profile - on Auth.userCreated event
 * - get your profile - GET /profile - uses access token to get userId
 * - get profile - GET /profile?userId=string
 * - update profile - PATCH /profile- body {field: string, value: string}
 * - delete profile - on Auth.userDeleted event
 */