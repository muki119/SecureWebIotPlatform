import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { CreatePairingCodeService } from "../services";

export async function CreatePairingCodeController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	// get user id from request
	// create random pairing code
	// add pairing code to database with userid and expiration time
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const userId = req.user?.sub;
		const { domainId } = req.params;
		const [pairingInfo, err] = await CreatePairingCodeService(
			userId as string,
			domainId as string,
		);
		if (err) {
			return res.status(400).json({ error: err.message });
		}
		res.status(201).json(pairingInfo).end();
	} catch (error) {
		next(
			new Error("Error in create pairing code controller", {
				cause: error,
			}),
		);
	}
}
