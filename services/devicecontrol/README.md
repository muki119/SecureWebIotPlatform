# Device Control Service

The Device Control Service is responsible for managing the devices within the platform

## Abilities

- Create, read, update and delete devices.

- Send commands to devices.

- Receive and process responses from devices.

- Store and manage telemetry data from devices.

## Pre-requisites

- A Mongodb instance - (device information and telemetry data storage)

- A Redis server (Event bus and pairing code)

- A MQTT broker - for device communication

## API Endpoints

- POST `/device/domain/:domainId/pair` - Creates a pairing code for a device to be paired with a domain

- POST `/device/domain/:domainId/activate`

  - Activates a device with a pairing code and adds it to the domain

  - Is a device only endpoint , the device will send the pairing code in the request body

  - Returns a JWT token that the device uses to connect to the MQTT broker and authenticate itself

- GET `/device/domain/:domainId` - Get a list of all devices in a domain

- GET `/device/:deviceId/telemetry?capability=<capability>&interval=<DAY|WEEK|MONTH>&from=<timestamp>`
  
  - Gets the latest telemetry data from a device.

- PATCH `/device/:deviceId/` - Update a device's basic information

  - Device capabilites cannot be updated.

- DELETE `/device/:deviceId/` - Delete a device

- **The creation and deletion of devices , requires that the user has the appropriate permissions in the domain**

**For more details on the api endpoints, please look at the api documentaion in the docs folder.**

### MQTT Topics

- #### Server Emitted Topics

  - `/device/:deviceId/commands`

    - The topic that the server sends commands to devices on. The device listens to this topic for incoming commands.

- #### Client Emitted Topics

  - `/device/+/telemetry`

    - The topic that devices send telemetry data to. The server listens to the topic , processes and stores the telemetry data , then sends the data through sockets to the clients for real-time updates.

### Socket.IO Events

- #### Server Emitted Events
  
  - `DOMAIN_USER_REMOVED`

    - Emitted to the clients when a user other than the authenticated user is removed from a domain.

  - `DOMAIN_USER_ADDED`

    - Emitted to the clients when a user other than the authenticated user is added to a domain.

  - `DOMAIN_USER_ROLE_UPDATED`

    - Emitted to the clients when a user's role in a domain is updated.

  - `DEVICE_ADDED`

    - Emitted to the clients when a new device is added to a domain.
  
  - `DEVICE_REMOVED`

    - Emitted to the clients when a device is removed from a domain.

  - `DEVICE_UPDATED`

    - Emitted to the clients when a device's information is updated.

  - `DEVICE_INFO_UPDATED`

    - Emitted to the clients when a device's basic information (name, description) is updated.

  - `DEVICE_TELEMETRY`

    - Emitted to the clients when new telemetry data is received from a device.

- #### Client Emitted Events

  - `DEVICE_CONTROL_UPDATE`

    - Used when a user wants to control a device or change a certain capability state of a device.

## Devices

### Device Capabilities

Devices can have different capabilites that define the type of data they can send and if they can recieve commands or not.

The capability types are as follows:

- Binary

  - Binary capabilities can only have two states , true or false (ON or OFF) .

    - Example: A light bulb can have a binary capability that represents whether it is on or off.

- RANGE

  - Range capabilities can have a value within a specified min and max range.

    - Example: A thermostat can have a range capability that represents the current temperature setting, which can be set to any value between 10 and 30 degrees Celsius.

- GUAGE
  - Guage capabilities can have a value that represents a measurement or reading.

    - Example: A humidity sensor can have a guage capability that represents the current humidity level in percentage.

    - Guage capabilites are read-only and cannot be controlled by the users

- ENUM

  - Enum capabilities can have a value that is one of a predefined set of values.

    - Example: A fan can have an enum capability that represents the current speed setting, which can be set to "low", "medium" or "high".

- COLOR

  - Color capabilities can have a value that represents a color in RGB hex format.

    - Example: A smart light can have a color capability that represents the current color setting, which can be set to any RGB color hex value.

## Event Bus

The Device Control Service listens to the following events from the event bus:

- `AUTH_SERVICE.USER_DELETED`
  - When a user is deleted by the Authentication service , the device control service deletes all user role entries for that user.

- `DOMAIN_SERVICE.DOMAIN_CREATED` - When a domain is created the domains owner is given the owner role in the device control service as well

- `DOMAIN_SERVICE.DOMAIN_USER_ADDED`

  - When a user is added to a domain a user role entry is created for that user in the device control service.

- `DOMAIN_SERVICE.DOMAIN_USER_ROLE_UPDATED`

  - When a user's role in a domain is updated it is updated in the device control service as well.

- `DOMAIN_SERVICE.DOMAIN_USER_REMOVED`

  - When a user is removed from a domain they are removed from the device control service as well.

## Additional Documentation

Please refer to additional documentation such as the .env.example for available configuration options.

## Docker

To build the docker image for the device control service, run the following command where the current working directory is the services dir:

```bash

docker build -t "device_control_service":1.0.0 -f devicecontrol/Dockerfile .

```
