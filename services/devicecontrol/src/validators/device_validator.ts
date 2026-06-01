import { checkSchema } from "express-validator";
import { DomainConstraints, UserIdConstraint } from "@services/common/validators";


export const DeviceValidator = checkSchema({
    deviceId: {
        in: "params",
        isString: true,
        isUUID: { options: 4 },
        notEmpty: true,
        errorMessage: "Device ID is required"
    }
})