const { Pool } = require('pg');

/**
 * PostgreSQL database connection pool
 * @type {Pool}
 */
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'nasa_system6_portal',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

/**
 * Initializes the NASA System 6 database schema
 * Creates the necessary tables for saved items and search history
 * @async
 * @function initDb
 * @returns {Promise<void>}
 * @throws {Error} If database initialization fails
 */
const initDb = async () => {
  console.log('Initializing NASA System 6 database schema...');
  const client = await pool.connect();
  try {
    // Schema from README.md
    const createSavedItemsTable = `
      CREATE TABLE IF NOT EXISTS saved_items (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          url TEXT,
          category TEXT,
          description TEXT,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    const createSavedSearchesTable = `
      CREATE TABLE IF NOT EXISTS saved_searches (
          id SERIAL PRIMARY KEY,
          query_string TEXT NOT NULL,
          search_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createSavedItemsTable);
    console.log('✅ Table "saved_items" created or already exists.');

    await client.query(createSavedSearchesTable);
    console.log('✅ Table "saved_searches" created or already exists.');

    console.log('🚀 NASA System 6 database initialization complete.');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end(); // End pool after init script runs
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

module.exports = {
  query,
  initDb,
  pool,
};
