import { checkSchema } from "express-validator";

export const RegisterValidator = checkSchema({
    forename: {
        optional: false,
        isString: true,
        trim: true,
        notEmpty: {
            options: {
                ignore_whitespace: true
            }
        },
        isLength: {
            options: { max: 90, min: 1 }
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
        isLength: {
            options: { min: 1, max: 90 },
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
        isLength: {
            options: { min: 8, max: 128 },
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



}, ["body"]) // email,password,forename,surname in body

export const LoginValidator = checkSchema({
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
        isLength: {
            options: { min: 8, max: 128 },
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
}, ["body"]) // email and password in body

export const ForgotPasswordValidator = checkSchema({
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
    }
}, ["body"]) // only email in body

export const ResetPasswordValidator = checkSchema({
    password: {
        in: ["body"],
        optional: false,
        isString: true,
        trim: true,
        isLength: {
            options: { min: 8, max: 128 },
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
    },
    token: {
        in: ["query"],
        optional: false,
        isString: true,
    }
}, ["body", "query"]) // password in body and id query param

export const CredentialChangeValidator = checkSchema({
    forename: {
        optional: true,
        isString: true,
        trim: true,
        notEmpty: {
            options: {
                ignore_whitespace: true
            }
        },
        isLength: {
            options: { max: 90, min: 1 }
        },
        isAlphanumeric: {
            options: ["en-GB", { ignore: " -" }]
        },
        errorMessage: "Invalid Forename."

    },
    surname: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
            options: { min: 1, max: 90 },
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
        optional: true,
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
        optional: true,
        isString: true,
        trim: true,
        isLength: {
            options: { min: 8, max: 128 },
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
}) // all opptional 