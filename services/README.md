# Services Directory

Here are the backend services for the Secure Web IoT Platform.

Each service is implemented as separate modules in an npm workspace.

## Architecture

The system follows a microservices architecture, where each service is responsible for certain functionalities.

The services are as follows:

- **Auth Service**
  - Responsible for user authentication and authorisation. It handles user registration, login, and token management.
  - Acts as the main source of truth for user data

- **Domain Service**
  - Responsible for managing the domains and their associated data. It handles domain registration, configuration, and management.
  - Acts as the main source of truth for domain and user role data.

- **Device Service**
  - Responsible for managing the devices and their associated data. It handles device registration, configuration, and management.
  - Also performs real-time data processing and communication with devices and the frontend.
  - Acts as the main source of truth for device data.

- **Ledger Service**
  - Responsible for logging all actions and events within domains and devices.

All services are built using the MVC design pattern, more specifically, just the model and controller layers.

The services also use stateless sessions, originating from the authentication service, to manage user sessions and securely hold user data across the system.

This allows for better scalability and maintainability as each service can be run without reliance on a shared database, which would undermine the microservice architecture and its benefits.

## Additional Directories

- **Common**
  - Contains shared code and utilities that are used across multiple services. This includes common data models, utility functions, and shared libraries.

- **Event Bus**
  - Contains the implementation of the event bus, which is used for communication between services. It handles the publishing and subscribing of events, allowing services to communicate asynchronously.

**Please look at the individual service directories for more details on their implementation and functionality.**


## Conventions

- Each service is named according to its main functionality, such as `auth`, `domain`, `device`, and `ledger`.

- The main entry point for each service is named `index.ts`.

- each service directory follows a model-controller-service structure where the models directory contains all the database models , the controllers contains the request handling logic and the services directory contains the business logic ,service and model interactions.

- file names are in snake_case

- class names are in PascalCase

- exported functions and variables are in PascalCase

- variables and function parameters are in camelCase

- constants are in UPPER_SNAKE_CASE

- types and interfaces are in PascalCase and prefixed with I for interfaces

- file names not in common directory are suffixed with their directory or purpose , since there are file with the same name but different purposes in the same service.

- e.g `get_profile_controller.ts` and `get_profile_service.ts` are both in the domain service and both have the same name but have different purposes, so they are suffixed with their purpose to avoid confusion.