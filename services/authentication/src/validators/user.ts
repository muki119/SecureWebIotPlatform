import { checkSchema } from "express-validator";
import type { Schema } from "express-validator"
import { PASSWORD_CONSTRAINTS } from "../utilities/password_hash"
import type { DefaultSchemaKeys } from "express-validator/lib/middlewares/schema";
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 90;
export const UserConstraints = {

    forename: {
        minLength: NAME_MIN_LENGTH,
        maxLength: NAME_MAX_LENGTH
    },
    surname: {
        minLength: NAME_MIN_LENGTH,
        maxLength: NAME_MAX_LENGTH
    },
    password: {
        minLength: PASSWORD_CONSTRAINTS.minLength, // minimum password length is 8 charachters - Following NIST guidelines
        maxLength: PASSWORD_CONSTRAINTS.maxLength, // maximum is 128 charachters - to allow for max security while ensuring a at worst performance
    },
} as const

const UserSchema: Schema<DefaultSchemaKeys> = {
    forename: {
        optional: false,
        isString: true,
        trim: true,
        escape: true,
        notEmpty: {
            options: {
                ignore_whitespace: true
            }
        },
        isLength: {
            options: { max: NAME_MAX_LENGTH, min: NAME_MIN_LENGTH }
        },
        isAlphanumeric: {
            options: ["en-GB", { ignore: " -" }]
        },
        errorMessage: "Invalid Forename."

    },
    surname: {
        optional: false,
        isString: true,
        trim: true,
        escape: true,
        isLength: {
            options: { min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH },
        },
        notEmpty: {
            options: {
                ignore_whitespace: false, // whitespace is not allowed
            },
        },
        isAlpha: {
            // allow [a-zA-Z0-9] and _
            options: ["en-GB", { ignore: ["-", "_"] }], // include underscore
        },
        errorMessage: "Invalid Surname.",
    },
    email: {
        optional: false,
        isString: true,
        trim: true,
        notEmpty: {
            options: {
                ignore_whitespace: false, // whitespace is not allowed
            },
        },
        isEmail: true,
        normalizeEmail: {
            options: {
                all_lowercase: true, // convert to lowercase
            },
        },
        errorMessage: "Invalid Email Address.",
    },
    password: {
        optional: false,
        isString: true,
        trim: true,
        escape: true,
        isLength: {
            options: { min: UserConstraints.password.minLength, max: UserConstraints.password.maxLength },
        },
        notEmpty: {
            options: {
                ignore_whitespace: false, // whitespace is not allowed
            },
        },
        isAlphanumeric: {
            // allow [a-zA-Z0-9] and _
            options: ["en-GB", { ignore: "_" }], // include underscore
        },
        errorMessage: "Invalid Password.",
    }
} as const


export const RegisterValidator = checkSchema(UserSchema, ["body"]) // email,password,forename,surname in body

export const LoginValidator = checkSchema({
    email: UserSchema.email!,
    password: UserSchema.password!
}, ["body"]) // email and password in body

export const ForgotPasswordValidator = checkSchema({
    email: UserSchema.email!
}, ["body"]) // only email in body

export const ResetPasswordValidator = checkSchema({
    password: UserSchema.password!,
    token: {
        in: ["query"],
        escape: true,
        optional: false,
        isString: true,
    }
}, ["body", "query"]) // password in body and id query param

/** 
 * credentials change will fall in the format of patch where it would contain
 * {field: , value: }
 * where field is one of email, password, forename or surname and value is the new value for that field
 */
