export function GetEnvVariable(key: string, defaultValue?: string): string {
    if (!key) {
        throw new Error("Key must be provided")
    }
    const value = import.meta.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
}