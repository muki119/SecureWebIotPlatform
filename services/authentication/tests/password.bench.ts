import { bench, describe, test, expect } from "vitest"
import { HashPassword, VerifyPassword, PASSWORD_CONSTRAINTS } from "../src/utilities/password_hash"
import { randomBytes, randomInt } from "crypto"
import { generateRandomPasswords, generatePassword } from "./password.test"

describe("Benchmarking Password Hashing and Verification", async () => {
    bench("Benchmarking Password Hashing", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        await HashPassword(password)
    }, { iterations: 1 })

    const randomPasswords = generateRandomPasswords(1000)
    const hashedPasswords = randomPasswords.map(async p => await HashPassword(p.password))
    bench("Benchmarking Password Verification", async () => {
        const i = randomInt(0, randomPasswords.length)
        await VerifyPassword(randomPasswords[i]!.password, await hashedPasswords[i]!)
    }, { time: 1000 })
})
