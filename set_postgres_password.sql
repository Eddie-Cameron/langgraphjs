-- SQL script to set a strong password for the PostgreSQL user
-- This should be run by a user with administrative privileges

-- Change the password for the 'postgres' user
ALTER USER postgres WITH PASSWORD 'StrongProductionPassword456';

-- Ensure the postgres user can only connect from localhost or Docker network
-- This requires that pg_hba.conf is properly configured
-- The actual configuration would depend on your specific network setup

-- Output confirmation
\echo 'PostgreSQL password has been updated successfully'
\echo 'Remember to update the corresponding password in your .env file'
\echo 'For security reasons, delete this script after use'