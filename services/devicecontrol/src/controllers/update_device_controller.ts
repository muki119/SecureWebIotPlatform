import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { UpdateDeviceService } from "../services";

export async function UpdateDeviceController(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const userId = req.user?.sub;
		const { deviceId } = req.params;
		const { changes } = req.body;
		const [updatedDevice, err] = await UpdateDeviceService(
			userId as string,
			deviceId as string,
			changes,
		);
		if (err) {
			return res.status(400).json({ error: err.message });
		}
		res.status(200).json(updatedDevice).end();
	} catch (error) {
		next(new Error("Failed to update device", { cause: error }));
	}
}
