const { Pool } = require('pg');

/**
 * PostgreSQL database connection pool
 * @type {Pool}
 */
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nasa_system6',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log(`📦 Database pool connected to ${process.env.DB_NAME || 'nasa_system6'}`);
});

/**
 * Initializes the NASA System 6 database schema
 * Creates the necessary tables for saved items and search history
 * @async
 * @function initDb
 * @returns {Promise<void>}
 * @throws {Error} If database initialization fails
 */
const fs = require('fs');
const path = require('path');

/**
 * Initializes the NASA System 6 database schema
 * Reads and executes the initial migration file
 * @async
 * @function initDb
 * @returns {Promise<void>}
 * @throws {Error} If database initialization fails
 */
const initDb = async () => {
  console.log('Initializing NASA System 6 database schema...');
  const client = await pool.connect();
  try {
    // Run initial schema migration
    const migrationPath = path.join(__dirname, 'scripts/migrations/001_initial_schema.sql');
    console.log(`Reading migration from: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSQL);
    console.log('✅ Database schema initialized from migration file.');

    // Run local user migration
    const localUserPath = path.join(__dirname, 'scripts/migrations/002_add_local_user.sql');
    console.log(`Adding local user from: ${localUserPath}`);
    const localUserSQL = fs.readFileSync(localUserPath, 'utf8');
    await client.query(localUserSQL);
    console.log('✅ Local user added for development mode.');

    // Run missing service columns migration
    const missingColsPath = path.join(__dirname, 'scripts/migrations/003_add_missing_service_columns.sql');
    console.log(`Adding missing service columns from: ${missingColsPath}`);
    const missingColsSQL = fs.readFileSync(missingColsPath, 'utf8');
    await client.query(missingColsSQL);
    console.log('✅ Missing service columns added.');

    console.log('🚀 NASA System 6 database initialization complete.');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    // Close pool only if this is being run as a standalone script
    if (require.main === module || (process.argv[1] && process.argv[1].includes('db:init'))) {
      pool.end();
    }
  }
};

/**
 * Executes a SQL query with optional parameters
 * @function query
 * @param {string} text - SQL query text
 * @param {Array} [params] - Optional query parameters
 * @returns {Promise<Object>} Query result object
 */
const query = (text, params) => pool.query(text, params);

/**
 * Executes a callback within a database transaction
 * @async
 * @function transaction
 * @param {Function} callback - Async function that receives a database client
 * @returns {Promise<any>} Result of the callback function
 * @throws {Error} If the transaction fails
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  initDb,
  pool,
  transaction,
};
