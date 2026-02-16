import { scryptSync, timingSafeEqual, randomBytes } from "node:crypto"
import logger from "../config/logger"



const SCRYPT_CONFIG = { N: 16384, r: 8, p: 1, keylen: 64 }
const SALT_LENGTH = 16 // 128 bits - enough for entropy
const PASSWORD_CONSTRAINTS = { minLength: 8, maxLength: 96 }
const ErrMinPasswordLength = `Password must be at least ${PASSWORD_CONSTRAINTS.minLength} characters long`
const ErrMaxPasswordLength = `Password must be at most ${PASSWORD_CONSTRAINTS.maxLength} characters long`
/**
 * 
 * @param plaintext 
 * @returns hashed password in the format of $n$p$r$salt$hash
 * @throws Error if the password does not meet the constraints or if there is an error during hashing
 * @description 
 ** n - scrypt N parameter  
 ** p - scrypt p parameter 
 ** r - scrypt r parameter 
 ** salt - random salt used for hashing
 ** hash - the hashed password
 * 
 ** This is to ensure that changes in the scrypt parameters will not affect the ability to verify existing passwords 
 * and also to allow for future changes in the hashing algorithm if needed without affecting existing passwords
 */

export function HashPassword(plaintext: string): string {

    if (plaintext.length < PASSWORD_CONSTRAINTS.minLength) {
        throw new Error(ErrMinPasswordLength)
    }
    if (plaintext.length > PASSWORD_CONSTRAINTS.maxLength) {
        throw new Error(ErrMaxPasswordLength)
    }
    try {
        const salt = randomBytes(SALT_LENGTH); //
        const derivedKey = scryptSync(plaintext, salt, SCRYPT_CONFIG.keylen, { N: SCRYPT_CONFIG.N, r: SCRYPT_CONFIG.r, p: SCRYPT_CONFIG.p }); // N - CPU/memory cost parameter, r - block size parameter, p - parallelization parameter
        const fString = `$${SCRYPT_CONFIG.N}$${SCRYPT_CONFIG.r}$${SCRYPT_CONFIG.p}$${salt.toString("base64")}$${derivedKey.toString("base64")}` // the formatted string - to be stored in the database§

        return fString
    } catch (err) {
        throw new Error("Error hashing password", { cause: err })
    }

}

/**
 * 
 * @param plaintext 
 * @param hash 
 * @returns A boolean indicating whether the plaintext matches the hash
 * @throws Error if password dosent meet the constaints ,if theres an invalud format or if there is an error during verification
 * @description 
 * The hash is expected to be in the format of $n$p$r$salt$hash
 */

export function VerifyPassword(plaintext: string, hash: string): boolean {
    if (plaintext.length < PASSWORD_CONSTRAINTS.minLength) {
        throw new Error(ErrMinPasswordLength)
    }
    if (plaintext.length > PASSWORD_CONSTRAINTS.maxLength) {
        throw new Error(ErrMaxPasswordLength)
    }
    try {
        const splitHash = hash.split("$");
        if (splitHash.length !== 6) {
            throw new Error("Invalid hash format")
        }
        const [_, Nstr, rstr, pstr, salt, hashedPassword] = splitHash;
        const hashToCompare = scryptSync(plaintext, Buffer.from(salt, "base64"), SCRYPT_CONFIG.keylen, { N: parseInt(Nstr, 10), r: parseInt(rstr, 10), p: parseInt(pstr, 10) });
        return timingSafeEqual(hashToCompare, Buffer.from(hashedPassword, "base64")) // to prevent timing attacks

    } catch (err) {
        logger.error({ err }, "Error verifying password")
        return false
    }

}