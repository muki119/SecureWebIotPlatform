import type { Request, Response, NextFunction } from 'express';
import type { UpdatePatch } from '@services/common/types';
import type { User } from '../models/user_model';
import { LogWarningDefault } from '../utilities/logging_utilities';
import CredentialChangeService from '../services/credential_change';
import logger from '../config/logger';
export default async function CredentialChangeController(req: Request, res: Response, next: NextFunction) {
    try {

        if (!req.body) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const { changes }: { changes: UpdatePatch<User> } = req.body;
        if (!changes || Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes provided" }).end();
        }
        const userId = req.user?.sub;
        if (!userId) {  // shouldnt happen since protected route 
            return res.status(401).json({ message: "Unauthorized" }).end();
        }

        const result = await CredentialChangeService(changes, userId);
        if (!result.success) {
            logger.warn({ ...LogWarningDefault(req), message: result.message }, `Credential change failed for user ${userId}}`);
            return res.status(400).json({ message: result.message }).end();
        }
        logger.info({ userId: userId }, `Credential change successful for user ${userId}}`);
        return res.status(200).json({ message: "Changes applied successfully" }).end();

    } catch (err) {
        next(err)
    }
}