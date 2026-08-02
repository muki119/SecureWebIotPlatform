# Secure Web IoT Platform

Final Year CompSci project 2026

## Description

A web-based IoT management platform that provides a secure interface for users to interact with IoT devices.

Through this application, users can view and control IoT devices and perform tasks such as turning on and off lights or monitoring environmental conditions.

To avoid unauthorised access, this application uses secure communication protocols to send data between the user's browser and the IoT devices, as well as security features like authentication and access control.

To prevent typical web vulnerabilities such as SQL injection and cross-site scripting attacks, the application employs safe coding practices such as input validation, output encoding, and parameterized queries to make this application more secure.

To protect against man-in-the-middle attacks, eavesdropping and unauthorised access, the system incorporates security features such as secure sockets layer (SSL/TLS) encryption and secure storage of data inside the database.

This repository contains the code for the backend and frontend of the applications, as well as the documentation for the system.

The system is currently built using NodeJS and React.

The system also utilises software such as:

- Docker for containerization and easy deployment of the system.
- PostgreSQL and MongoDB for databases
- Redis for time-sensitive data storage and as an event bus.
- Docker for containerization and easy deployment of the system.
- Socket.io for real-time communication between the frontend and backend services.
- MQTT for communication between the backend and IoT devices.
- Nginx for reverse proxying.

## File Structure

- `services/` - Contains the code for the backend serices of the system

- `app/` - Contains the code for the frontend of the system

## Installation

Individual services can be run by navigating to their directories and running them.

**For further details on the services, please look at the services directory.**

