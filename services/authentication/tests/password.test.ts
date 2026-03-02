import { describe, expect, test, bench } from "vitest"
import { HashPassword, VerifyPassword, PASSWORD_CONSTRAINTS } from "../src/utilities/password_hash"
import { randomBytes, randomInt } from "crypto"


export const generatePassword = (length: number) => {
    return randomBytes(length).toString("base64url").slice(0, length) // slice to ensure the password is exactly the desired length
}
describe("Testing Password Hashing", () => {
    test("Hashes password correctly given valid password", async () => {
        const validPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(validPassword)
        expect(hash).toBeDefined()
    })
    test("Returns error when given no password", () => {
        expect(async () => await HashPassword("")).rejects.toThrow()
    })
    test("Returns error when given a password that is too short", () => {
        const shortPassword = generatePassword(randomInt(1, PASSWORD_CONSTRAINTS.minLength - 1))
        expect(async () => await HashPassword(shortPassword)).rejects.toThrow()
    })
    test("Returns error when given a password that is too long", () => {
        const longPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.maxLength + 1, PASSWORD_CONSTRAINTS.maxLength + 20))
        expect(async () => await HashPassword(longPassword)).rejects.toThrow()
    })

})

describe("Testing Password Verification", () => {
    test("Verifies correct password successfully", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        const isValid = await VerifyPassword(password, hash)
        expect(isValid).toBe(true)
    })
    test("Fails to verify incorrect password", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const wrongPassword = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        const isValid = await VerifyPassword(wrongPassword, hash)
        expect(isValid).toBe(false)
    })
    test("Fails to verify when given empty password", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        const hash = await HashPassword(password)
        expect(async () => await VerifyPassword("", hash)).rejects.toThrow()
    })
    test("Fails to verify when given empty hash", async () => {
        const password = generatePassword(randomInt(PASSWORD_CONSTRAINTS.minLength, PASSWORD_CONSTRAINTS.maxLength))
        expect(async () => await VerifyPassword(password, "")).rejects.toThrow()
    })
})


/**
 * 
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


