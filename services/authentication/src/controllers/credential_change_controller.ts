import type { Request, Response, NextFunction } from 'express';
import type { UpdatePatch } from '@services/common/types';
import type { IUser } from '../models/user_model';
import CredentialChangeService from '../services/credential_change';
import logger from '../config/logger';
export default async function CredentialChangeController(req: Request, res: Response, next: NextFunction) {
    try {

        if (!req.body) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const { changes, password }: { changes: UpdatePatch<IUser>, password?: string } = req.body;
        if (!changes || Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const userId = req.user?.sub;
        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }
        const [_, err] = await CredentialChangeService(changes, userId, password);
        if (err) {
            return res.status(400).json({ message: err.message }).end();
        }
        logger.info({ userId: userId }, `Credential change successful for user ${userId}}`);
        return res.status(200).json({ message: "Changes applied successfully" }).end();

    } catch (err) {
        next(err)
    }
}