export function decodeName(name: string | undefined | null): string {
    if (!name) return "";
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}
