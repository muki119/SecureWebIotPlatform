import { randomBytes } from "node:crypto";

export async function GenerateRandomBytes(length: number): Promise<Buffer> {
	if (length <= 0 || !Number.isInteger(length)) {
		throw new Error("Length must be a positive integer");
	}
	return new Promise((resolve, reject) => {
		randomBytes(length, (err, buf) => {
			if (err) {
				reject(err);
			} else {
				resolve(buf);
			}
		});
	});
}
