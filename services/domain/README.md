# Domain Service

The Domain service's primary responsibility is to manage the platform's domains feature.
It provides functionality to create, read, update, and delete domains, as well as manage users, user roles, and their associations within the domain and platform.

Within domains, users are assigned roles that determine their permissions and their access to perform certain actions within the domain

## User Roles

- Owner

    Has full control over the domain and its settings, including the ability to manage users and their roles, devices and the ability to delete the domain itself.

    The owner role is given to the user who creates the domain.
    Each domain must have an owner, and only the owner can transfer ownership to another user.
    The owner can also leave the domain, but only after transferring ownership to another user or deleting the domain.

- Admin

    Has administrative privileges within the domain, allowing them to manage users and their roles, but cannot delete the domain.

- Member

    Has basic access to the domain and its resources, but cannot make changes to the domain settings or manage users.

## API Endpoints

### Domain Routes

These routes are responsible for the creation, reading, updating and deletion of domains. They also provide the functionality to manage the users within a domain and their roles and associations.

- POST `/domain` - Create a new domain

- GET `/domain` - Get a list of all domains the authenticated user is a member of

- PATCH `/domain/:domainId` - Update a domain

- DELETE `/domain/:domainId` - Delete a domain

---

- POST `/domain/:domainId/user` - Add a user to a domain

- GET `/domain/:domainId/users` - Get a list of all users in a domain

- PATCH `/domain/:domainId/user/:userId/role` - Update a user's role in a domain

- POST `/domain/:domainId/leave` - Leave a domain

- DELETE `/domain/:domainId/user/:userId` - Remove a user from a domain

---

### Profile Routes

These routes are responsible for the reading and updating of the user profile information.

The creation and deletion of Profiles are triggered by the creation and deletion of user accounts by the Authentication service. Therefore, the application utilises the event bus to listen for those events.

- GET `/profile/me` - Get the authenticated user's profile information

- PATCH `/profile/me` - Update the authenticated user's profile information

- GET `/profile/:userId` - Get a user's profile information by their user ID

- GET `/profile/search?email=<email>&limit=<limit>` - Search for users by their email

**For more details on the api endpoints, please look at the api documentaion in the docs folder.**

## Event Bus

- The Domain service listens to these events:
  - `AUTH_SERVICE.USER_CREATED` - When a user is created by the Authentication service

  - `AUTH_SERVICE.USER_DELETED` - When a user is deleted by the Authentication service

  - `AUTH_SERVICE.USER_UPDATED` - When a user is updated by the Authentication service

- In addition, it currently also emits the following events:

  - `DOMAIN_SERVICE.DOMAIN_CREATED` - When a domain is created

  - `DOMAIN_SERVICE.DOMAIN_USER_ADDED` - When a user is added to a domain

  - `DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED` - When a user's role in a domain is updated

  - `DOMAIN_SERVICE.DOMAIN_USER_UPDATED` - When a user's information in a domain is updated

  - `DOMAIN_SERVICE.DOMAIN_USER_REMOVED` - When a user is removed from a domain


## Docker
To build the docker image for the domain service, run the following command where the current working directory is the services dir:

```bash

docker build -t "domain_service":1.0.0 -f domain/Dockerfile .  

```