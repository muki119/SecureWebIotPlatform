export interface User { // this application wont utilise a username field i think , should probably be email instead
    id?: string, // uuidv4+
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    createdAt: Date,
    deletedAt?: Date | null
}
