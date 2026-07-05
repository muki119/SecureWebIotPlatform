CREATE ROLE authentication_service WITH LOGIN ;
CREATE ROLE domain_service WITH LOGIN ;
CREATE ROLE ledger_service WITH LOGIN;
CREATE DATABASE authentication_service;
CREATE DATABASE domain_service;
CREATE DATABASE ledger_service;

GRANT CONNECT ON DATABASE authentication_service TO authentication_service;
GRANT CONNECT ON DATABASE domain_service TO domain_service;
GRANT CONNECT ON DATABASE ledger_service TO ledger_service;

\c authentication_service
CREATE SCHEMA public;
\ir ../services/authentication/src/db/users_table.sql
GRANT USAGE ON SCHEMA public TO authentication_service;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authentication_service;

\c domain_service
CREATE SCHEMA public;
\ir ../services/domain/src/db/domains_table.sql
\ir ../services/domain/src/db/profile_table.sql
GRANT USAGE ON SCHEMA public TO domain_service;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO domain_service;

\c ledger_service
CREATE SCHEMA public;
\ir ../services/ledger/src/db/transactions.sql
\ir ../services/ledger/src/db/user_roles.sql
GRANT USAGE ON SCHEMA public TO ledger_service;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ledger_service;
