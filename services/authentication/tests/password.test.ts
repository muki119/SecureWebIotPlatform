import { describe, expect, test, assert } from "vitest"
import { HashPassword, VerifyPassword, PASSWORD_CONSTRAINTS, ErrMaxPasswordLength, ErrMinPasswordLength, ErrHashRequired } from "../src/utilities/password_hash"
import { randomBytes, randomInt } from "crypto"


export const generatePassword = (length: number) => {
    return randomBytes(length).toString("base64url").slice(0, length) // slice to ensure the password is exactly the desired length
}
describe("Testing Password Hashing", () => {
    test("Hashes password correctly given valid password", async () => {
        const validPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(validPassword)
        assert.exists(hash, "Expected hash to be generated for valid password")
    })
    test("Throws error when given no password", async () => {
        await expect(() => HashPassword("")).rejects.toThrow(ErrMinPasswordLength)
    })
    test("Throws error when given a password that is too short", async () => {
        const shortPassword = generatePassword(randomInt(1, PASSWORD_CONSTRAINTS.minLength - 1))
        await expect(() => HashPassword(shortPassword)).rejects.toThrow(ErrMinPasswordLength)
    })
    test("Throws error when given a password that is too long", async () => {
        const longPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.maxLength + 1, PASSWORD_CONSTRAINTS.maxLength + 20))
        await expect(() => HashPassword(longPassword)).rejects.toThrow(ErrMaxPasswordLength)
    })

})

describe("Testing Password Verification", () => {
    test("Verifies correct password successfully", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        const isValid = await VerifyPassword(password, hash)
        assert.strictEqual(isValid, true, "Expected password verification to succeed with correct password")
    })
    test("Fails to verify incorrect password", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const wrongPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        const isValid = await VerifyPassword(wrongPassword, hash)
        assert.strictEqual(isValid, false, "Expected password verification to fail with incorrect password")
    })
    test("Fails to verify when given empty password", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        await expect(() => VerifyPassword("", hash)).rejects.toThrow(ErrMinPasswordLength)
    })
    test("Fails to verify when given empty hash", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        await expect(() => VerifyPassword(password, "")).rejects.toThrow(ErrHashRequired)
    })
})


/**
 * @param quantity 
 * @description generates an ammount of random passwords with the chances of them being invalid based on the PASSWORD_CONSTRAINTS
 */
export function generateRandomPasswords(quantity: number) {
    const passwords: { password: string, valid: boolean }[] = []
    for (let i = 0; i < quantity; i++) {
        const passwordLength = randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength + 1) // generate passwords that are between 1 and 10 characters longer than the minimum length
        const password = generatePassword(passwordLength)
        passwords.push({
            password,
            valid: password.length >= PASSWORD_CONSTRAINTS.minLength && password.length <= PASSWORD_CONSTRAINTS.maxLength,
        })
    }
    return passwords
}


