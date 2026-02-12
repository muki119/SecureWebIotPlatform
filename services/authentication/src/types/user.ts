export interface User {
    id?: string, // uuidv4+
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    createdAt: Date,
    deletedAt?: Date | null
}


declare module 'express-session' {
    interface SessionData {
        user: User | null
    }
}