import { Pool, PoolClient } from "pg"

/**
 * ModelSchema is the general shape of all models in the database, they can have any fields but must have an id and createdAt field
 */
export interface ModelSchema {
    id: string | number,
    createdAt: Date,
}

/**
 * IDatabaseModelOpperations
 * The generic interface for all database models in the application.
 * they must implement all these functions to work across the application
 * allows for loose coupling and ability to change database without massive changes to the rest of the codebase
 */
export interface IDatabaseModelOpperations<T extends ModelSchema> { // all database models should implement this basic interface for ease of use and ability to change db if needed
    create(item: Omit<T, "id" | "createdAt"> & { id?: string }): Promise<T>,
    findById(id: string): Promise<T | null>,
    update(id: string, patch: UpdatePatch<T>): Promise<T>,
    delete(id: string): Promise<void>
}


export type UpdatePatch<T extends ModelSchema> = UpdateSet<T>[] // basically and array of changes to make on a record
export type UpdateSet<T extends ModelSchema> = { field: keyof Omit<T, "id" | "createdAt">, value: any } // states the field to update and the new value to set it to - the field can only be a key of Type t 
// more specifically the field must be of any key in anything that extends ModelSchema 

type DbOperation<T> = (conn: PoolClient) => Promise<T>
/**
 * PostgresDatabase model is a base class for all models that interface with the postgres database.
 * * It implements all the basic opperations for interacting with the database as usual.
 * * It also contains a helping function poolWrap which wraps all opperations 
 * to easily manage the allocation and release of connections from the pool.
 * 
 */
export declare class PostgresDatabaseModel<T extends ModelSchema> implements IDatabaseModelOpperations<T> {
    protected db: Pool
    constructor(db: Pool)
    protected poolWrap: <U>(operation: DbOperation<U>) => Promise<U>;
    public create(item: Omit<T, "id" | "createdAt"> & { id?: string }): Promise<T>;
    public findById(id: string): Promise<T | null>
    public update(id: string, patch: UpdatePatch<T>): Promise<T>
    public delete(id: string): Promise<void>
}