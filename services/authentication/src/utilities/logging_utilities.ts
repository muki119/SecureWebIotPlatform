import { type Request } from "express";



const dynamicRoutesRegexMap = new Map<string, string>([
    ["/(reset-password)\\?token=([a-zA-Z0-9])*", "/reset-password"]
]);
export const LogWarningDefault = (req: Request) => {
    return {
        user_agent: req.get("User-Agent"),
        route: GetRoutePath(req),
    }
}

export function GetRoutePath(req: Request): string { // o(n) but its extremley small n to the extent that its basically constant

    const routePath = req.route?.path || req.url;
    for (const [regex, replacement] of dynamicRoutesRegexMap) {
        if (new RegExp(regex).test(routePath)) {
            return replacement;
        }
    }
    return routePath;

}