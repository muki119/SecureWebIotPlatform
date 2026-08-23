import { GenerateRandomBytes } from "@services/common/utilities";

export const CODE_LENGTH = 6;
export function VerifyPairingCode(
	code: string,
	CodeLength: number = CODE_LENGTH,
): boolean {
	// check code doesn't have the same number repeated more than twice in 3 characters - sliding window leetcode medium lol

	if (!code || typeof code !== "string" || code.length !== CodeLength) {
		return false;
	}
	let isIncremental = true;
	let isDecremental = true;

	for (let i = 0; i < code.length; i++) {
		if (i >= 2 && code[i] === code[i - 1] && code[i] === code[i - 2]) {
			// if the current char has 3 of the same char in a row then its invalid - max in window of 3 is 2
			return false;
		}
		if (i > 0) {
			const prev = code.charCodeAt(i - 1);
			isIncremental = isIncremental && code.charCodeAt(i) === prev + 1; // if the char codes are incremental by 1 then its incremental
			isDecremental = isDecremental && code.charCodeAt(i) === prev - 1; // if the char codes are decremental by 1 then its decremental
		}
	}
	return !(isIncremental || isDecremental); // if the code is either incremental or decremental then its invalid

	// check the code isnt incremental or decremental
}

export async function GeneratePairingCode(
	CodeLength: number = CODE_LENGTH,
): Promise<string> {
	while (true) {
		const bytes = await GenerateRandomBytes(CodeLength / 2);
		const code = bytes.toString("hex").toUpperCase();
		if (VerifyPairingCode(code, CodeLength)) {
			// check that the code is valid and not incremental or decremental
			return code;
		}
	}
}
