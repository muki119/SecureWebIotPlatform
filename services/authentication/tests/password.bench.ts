import { bench, describe, test, expect } from "vitest"
import { HashPassword, VerifyPassword, PASSWORD_CONSTRAINTS } from "../src/utilities/password_hash"
import { randomBytes, randomInt } from "crypto"
import { generateRandomPasswords, generatePassword } from "./password.test"

describe("Benchmarking Password Hashing and Verification", () => {
    bench("Benchmarking Password Hashing", () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        HashPassword(password)
    }, { iterations: 1 })

    const randomPasswords = generateRandomPasswords(1000)
    const hashedPasswords = randomPasswords.map(p => HashPassword(p.password))
    bench("Benchmarking Password Verification", () => {
        const i = randomInt(0, randomPasswords.length)
        VerifyPassword(randomPasswords[i]!.password, hashedPasswords[i]!)
    }, { time: 1000 })
})
