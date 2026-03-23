import type { Request, Response, NextFunction } from 'express';
import { requestDurationHistogram } from '../config/metrics';
import { GetRoutePath } from '@services/common/utilities';



export default function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const timer = requestDurationHistogram.startTimer({
        method: req.method,
        route: GetRoutePath(req), // if route is undefined (e.g. for 404s) use the url instead
    });
    res.on('finish', () => {
        timer({ status_code: res.statusCode });
    });
    next();
}





