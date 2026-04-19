

export type Result<T> = [T, null] | [null, E extends Error ? E : Error];