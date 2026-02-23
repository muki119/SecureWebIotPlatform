import type { Request, Response, NextFunction } from 'express';
import { requestDurationHistogram } from '../config/metrics';



export default function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const timer = requestDurationHistogram.startTimer({
        method: req.method,
        route: getRoutePath(req), // if route is undefined (e.g. for 404s) use the url instead
    });
    res.on('finish', () => {
        timer({ status_code: res.statusCode });
    });
    next();
}



const dynamicRoutesRegexMap = new Map<string, string>([
    ["/(reset-password)\\?token=([a-zA-Z0-9])*", "/reset-password"]
]);

function getRoutePath(req: Request): string { // o(n) but its extremley small n to the extent that its basically constant

    const routePath = req.route?.path || req.url;
    for (const [regex, replacement] of dynamicRoutesRegexMap) {
        if (new RegExp(regex).test(routePath)) {
            return replacement;
        }
    }
    return routePath;

}