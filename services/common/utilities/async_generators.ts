import { randomBytes } from "node:crypto"


export async function GenerateRandomBytes(length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        randomBytes(length, (err, buf) => {
            if (err) {
                reject(err)
            } else {
                resolve(buf)
            }
        })
    })
}