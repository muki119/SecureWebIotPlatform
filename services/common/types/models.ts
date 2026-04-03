import { Pool, type PoolClient } from "pg"
import { Schema, Connection, Model, type ClientSession } from "mongoose";
import type { Result } from "./result"
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
export type ModelDTO<T extends ModelSchema> = Omit<T, "id" | "createdAt" | "deletedAt" | "updatedAt">


export type MongoModelSchema<T extends ModelSchema> = Omit<T, "id"> & { _id: Schema.Types.UUID } // for mongo models we use _id instead of id and its a uuid type

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
export interface IAssociationModelOperations<T extends ModelSchema> {
	create(item: ModelDTO<T>): Promise<T>,
	//find functions are way more specific for association models since they can be found using userid or associated id's 
	// so they will be implemntation specific and not standardised and interfaced 
	/**
	 * 
	 * @param userId 
	 * @param associatedId 
	 * @param patch 
	 * @description update function for association models  - is optional because not all assosciations need updating  
	 */
	update?(userId: string, associatedId: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>,
	delete(userId: string, associatedId: string): Promise<void>
}


export type UpdatePatch<T extends ModelSchema> = UpdateSet<T>[] // basically and array of changes to make on a record

/**
 * states the field to update and the new value to set it to - the field can only be a key of Type t 
 * more specifically the field must be of any key in anything that extends ModelSchema removes
 * 
 * * Forms a union type for all fields in the union type
 * * key of modelDto is the indexer for the mapped types - so it creates a union type for all possible fields for the given type T
 */
export type UpdateSet<T extends ModelSchema> = { [K in keyof ModelDTO<T>]-?: { field: K & string, value: ModelDTO<T>[K] } }[keyof ModelDTO<T>]
export type UpdateResult<T extends ModelSchema> = Result<T> // the result of an update operation - success or failure and an optional message and the updated user if the update was successful
type DbOperation<T> = (conn: PoolClient) => Promise<T>


/**
 * BasePostgresModel is a base class for all models that interface with the postgres database.
 */
abstract class BasePostgresModel<T extends ModelSchema> {
	protected db: Pool
	protected abstract updatableFieldsMap: Map<keyof ModelDTO<T>, string> // a map of the fields that can be updated and their corresponding data types - used for validation in updates
	constructor(db: Pool) {
		this.db = db
	}


	public async multiTableTransaction<U>(operations: DbOperation<any>): Promise<U | any> {
		return this.transactionWrap(operations)
	}

	/**
	 * 
	 * @param operation the db opperation to perform with the connection - takes a connection and returns a promise of a type
	 * @returns returns a promise of a type U which is the result of the db opperation 
	 * @description this function is a wrapper function for all db opperations to easily manage pool connections and cut down on boilerplate
	 *  * theres already a lot of boilerplate with db opperations like transaction management so i dont need any extra , especially one that could be so easily abstracted
	 */
	protected async poolWrap<U>(operation: DbOperation<U>): Promise<U> {
		const conn = await this.db.connect() // gets a connection from the pool
		try {
			const res = await operation(conn) // performs the opperation with the connection
			return res // if success then return the result
		} catch (err) {
			throw err // otherwise throw the error
		} finally {
			conn.release()
		}
	};

	/**
	 * 
	 * @param operation  - the db operation to be performed , 
	 * * functions shouldnt take a connection or start a transactions , since that the whole point of this function
	 * @param externalConn - optional external connection to use for the transactions
	 * @returns 
	 * @description this function is a wrapper for transactional db opperations , 
	 * also provideds the option to use an external connection , from multi table transactions
	 */
	protected async transactionWrap<U>(operation: DbOperation<U>, externalConn?: PoolClient): Promise<U> {

		if (externalConn) {
			return await operation(externalConn) // if an external connection is provided, use it (for multi table transactions)
		}
		return await this.poolWrap(async (conn) => {
			try {
				const beginTransaction = await conn.query("BEGIN")
				if (beginTransaction.command !== "BEGIN") {
					throw new Error("Failed to begin transaction")
				}
				const result = await operation(conn)
				const commitTransaction = await conn.query("COMMIT")
				if (commitTransaction.command !== "COMMIT") {
					throw new Error("Failed to commit transaction")
				}
				return result
			} catch (error) {
				await conn.query("ROLLBACK")
				throw error
			}
		})
	}
	/**
	 * 
	 * @param patch the update patch to create the set string and values arr from
	 * @returns a tuple of the set string and the values array.
	 * set string param starts at 2 because update queries will have the id as the first param
	 * @description builds the set string for the update query and the values that correspond to the fields being updated
	 */
	protected async createSetValues(patch: UpdatePatch<T>, startIdx: number = 2): Promise<[string, any[]]> {
		let setStringArr: string[] = []
		let seenSet = new Set<keyof ModelDTO<T>>() // to keep track of what is already been set in the patch 
		// - so you dont have 2 patches changing the same field
		for (let i = 0; i < patch.length; i++) {
			const change = patch[i]!

			if (!change.field || change.value === undefined) {
				throw new Error(`Field and value are required for all changes in update patch`)
			}
			if (!this.updatableFieldsMap.has(change.field)) {
				throw new Error(`Invalid field ${change.field} in update patch`)
			}
			if (seenSet.has(change.field)) {
				throw new Error(`Duplicate field ${change.field} in update patch`)
			}
			if (typeof change.value !== this.updatableFieldsMap.get(change.field)) {
				throw new Error(`Invalid data type for field ${change.field}: expected ${this.updatableFieldsMap.get(change.field)}, got ${typeof change.value}`)
			}
			seenSet.add(change.field)
			setStringArr.push(`${change.field} = $${i + startIdx}`) // build the set string for the update query - starts at $2 because $1 is the id in the where clause
		}
		return [setStringArr.join(", "), patch.map(change => change.value)] // returns the set string and the values for the update query
	}
}

/**
 * PostgresDatabase model is a base class for all models that interface with the postgres database.
 * * It implements all the basic opperations for interacting with the database as usual.
 * * It also contains a helping function poolWrap which wraps all opperations 
 * to easily manage the allocation and release of connections from the pool.
 * 
 */
export abstract class PostgresDatabaseModel<T extends ModelSchema> extends BasePostgresModel<T> implements IDatabaseModelOperations<T> {
	constructor(db: Pool) {
		super(db)
	}
	public abstract create(item: ModelDTO<T>): Promise<T>;
	public abstract findById(id: string): Promise<T | null>;
	public abstract update(id: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>;
	public abstract delete(id: string): Promise<void>;
}
/**
 * PostgresAssociationModel is a base class for all models that represent associations between two entities in the database.
 */
export abstract class PostgresAssociationModel<T extends ModelSchema> extends BasePostgresModel<T> implements IAssociationModelOperations<T> {
	constructor(db: Pool) {
		super(db)
	}
	public abstract create(item: ModelDTO<T>): Promise<T>;
	public abstract delete(userId: string, associatedId: string): Promise<void>;
	public update?(userId: string, associatedId: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>;
}

// will make one for mongo at some point for the devices service


export abstract class BaseMongoModel<T extends ModelSchema> implements IDatabaseModelOperations<T> {
	protected db: Connection
	protected model: Model<T>;
	protected abstract updatableFieldMap: Map<keyof ModelDTO<T>, string>
	constructor(db: Connection, schema: Schema<T>, modelName: string) {
		this.db = db
		this.model = this.db.model<T>(modelName, schema)
	}

	async createUpdateObject(patch: UpdatePatch<T>): Promise<[Partial<Record<keyof ModelDTO<T>, unknown>>, null] | [null, Error]> {
		let seenSet = new Set<keyof ModelDTO<T>>()
		let result: Partial<Record<keyof ModelDTO<T>, unknown>> = {}
		for (let i = 0; i < patch.length; i++) {
			const change = patch[i]!
			if (!change.field || change.value === undefined) {
				return [null, new Error(`Field and value are required for all changes in update patch`)]
			}
			if (!this.updatableFieldMap.has(change.field)) {
				return [null, new Error(`Invalid field ${change.field} in update patch`)]
			}
			if (seenSet.has(change.field)) {
				return [null, new Error(`Duplicate field ${change.field} in update patch`)]
			}
			if (typeof change.value !== this.updatableFieldMap.get(change.field)) {
				return [null, new Error(`Invalid data type for field ${change.field}: expected ${this.updatableFieldMap.get(change.field)}, got ${typeof change.value}`)]
			}
			seenSet.add(change.field)
			result[change.field] = change.value
		}
		return [result, null]
	}


	async transactionWrap<U>(operation: (session: ClientSession) => Promise<U>, externalSession?: ClientSession): Promise<U> {
		if (externalSession) {
			return await operation(externalSession) // if an external session is provided, use it (for multi table transactions)
		}
		const session = await this.db.startSession()
		try {
			session.startTransaction()
			const result = await operation(session)
			await session.commitTransaction()
			return result
		} catch (error) {
			await session.abortTransaction()
			throw error
		} finally {
			session.endSession()
		}
	}

	abstract create(item: ModelDTO<T>): Promise<T>;
	abstract findById(id: string): Promise<T | null>;
	abstract update(id: string, patch: UpdatePatch<T>): Promise<UpdateResult<T>>;
	abstract delete(id: string): Promise<void>;

}