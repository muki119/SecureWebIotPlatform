import { Pool, type PoolClient } from "pg"

/**
 * ModelSchema is the general shape of all models in the database, they can have any fields but must have an id and createdAt field
 */
export interface ModelSchema {
    id: string,
    createdAt: Date,
    deletedAt: Date | null
}


/**
 * ModelDTO (Data Transfer Object) is a type that represents incomming data for working with models 
 * Basically the same as the modelschema interface but without the id and created at fields because those comefrom the db
 */
export type ModelDTO<T extends ModelSchema> = Omit<T, "id" | "createdAt" | "deletedAt">



/**
 * IDatabaseModelOpperations
 * The generic interface for all database models in the application.
 * they must implement all these functions to work across the application
 * allows for loose coupling and ability to change database without massive changes to the rest of the codebase
 */
export interface IDatabaseModelOperations<T extends ModelSchema> { // all database models should implement this basic interface for ease of use and ability to change db if needed
    create(item: ModelDTO<T>): Promise<T>,
    findById(id: string): Promise<T | null>,
    update(id: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>,
    delete(id: string): Promise<void>
}


export type UpdatePatch<T extends ModelSchema> = UpdateSet<T>[] // basically and array of changes to make on a record

/**
 * states the field to update and the new value to set it to - the field can only be a key of Type t 
 * more specifically the field must be of any key in anything that extends ModelSchema 
 * removes
 */
export type UpdateSet<T extends ModelSchema> = { [K in keyof ModelDTO<T>]-?: { field: K, value: ModelDTO<T>[K] } }[keyof ModelDTO<T>]

export type UpdateResult<T extends ModelSchema> = { success: boolean, message?: string, updatedItem?: T } // the result of an update operation - success or failure and an optional message and the updated user if the update was successful
type DbOperation<T> = (conn: PoolClient) => Promise<T>
/**
 * PostgresDatabase model is a base class for all models that interface with the postgres database.
 * * It implements all the basic opperations for interacting with the database as usual.
 * * It also contains a helping function poolWrap which wraps all opperations 
 * to easily manage the allocation and release of connections from the pool.
 * 
 */
export abstract class PostgresDatabaseModel<T extends ModelSchema> implements IDatabaseModelOperations<T> {
    protected db: Pool
    constructor(db: Pool) {
        this.db = db
    };
    protected abstract poolWrap: <U>(operation: DbOperation<U>) => Promise<U>;
    public abstract create(item: ModelDTO<T>): Promise<T>;
    public abstract findById(id: string): Promise<T | null>;
    public abstract update(id: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>;
    public abstract delete(id: string): Promise<void>;
}