import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { GetDomainDevicesService } from "../services";

export async function GetDomainDevicesController(
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
		const { domainId } = req.params;
		const [devices, err] = await GetDomainDevicesService(
			userId as string,
			domainId as string,
		);
		if (err) {
			return res.status(400).json({ error: err.message });
		}
		res.status(200).json(devices).end();
	} catch (error) {
		next(new Error("Failed to get devices in domain", { cause: error }));
	}
}
