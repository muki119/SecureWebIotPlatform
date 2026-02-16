CREATE TABLE IF NOT EXISTS USERS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID (),
    FORENAME VARCHAR(90) NOT NULL,
    LAST_NAME VARCHAR(90) NOT NULL,
    EMAIL VARCHAR(255) NOT NULL UNIQUE,
    PASSWORD_HASH VARCHAR(255) NOT NULL,
    /* The max is dependant on the hash alogrithm digest length and will change depending on the algorithm config values*/
    CREATED_AT TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UPDATED_AT TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    DELETED_AT TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS IDX_USERS_EMAIL ON USERS (EMAIL)
WHERE DELETED_AT IS NULL;
-- this index is used to speed up queries that search for users by email, but only for active (non-deleted) users
/** This function and the trigger just updates the updated_at collumn every single time any field of a record is updated 
 */
CREATE OR REPLACE FUNCTION UPDATE_UPDATED_AT_COLUMN () RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();