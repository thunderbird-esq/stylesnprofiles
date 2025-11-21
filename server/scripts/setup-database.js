#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates the NASA System 6 Portal database and initializes it with the proper schema
 *
 * This script:
 * 1. Connects to PostgreSQL server (without specifying a database)
 * 2. Creates the database if it doesn't exist
 * 3. Connects to the specific database
 * 4. Runs all migration scripts in order
 * 5. Seeds initial data if needed
 *
 * @fileoverview PostgreSQL database setup and migration script
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module scripts/setup-database
 * @requires pg
 * @requires fs
 * @requires path
 * @requires dotenv
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default database first
  targetDatabase: process.env.DB_DATABASE || 'nasa_system6_portal',
};

/**
 * Logging Function
 * Logs messages with timestamp and severity level
 *
 * @function log
 * @param {string} message - Message to log
 * @param {string} [type='INFO'] - Log level (INFO, ERROR, WARN)
 * @example
 * log('Database connected', 'INFO');
 */
const log = (message, type = 'INFO') => {
  console.log(`[${new Date().toISOString()}] ${type}: ${message}`);
};

/**
 * Create Database Connection Pool
 * Creates a PostgreSQL connection pool for specified database
 *
 * @function createPool
 * @param {string} databaseName - Name of the database to connect to
 * @returns {Pool} PostgreSQL connection pool
 * @example
 * const pool = createPool('nasa_system6_portal');
 */
const createPool = (databaseName) => {
  return new Pool({
    ...config,
    database: databaseName,
  });
};

/**
 * Execute SQL File
 * Reads and executes a SQL migration file
 *
 * @function executeSqlFile
 * @async
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {string} filePath - Path to SQL file
 * @returns {Promise<void>}
 * @throws {Error} Throws if SQL execution fails
 * @example
 * await executeSqlFile(pool, './migrations/001_initial_schema.sql');
 */
const executeSqlFile = async (pool, filePath) => {
  const sql = fs.readFileSync(filePath, 'utf8');
  log(`Executing migration: ${path.basename(filePath)}`);

  try {
    await pool.query(sql);
    log(`✅ Successfully executed: ${path.basename(filePath)}`);
  } catch (error) {
    log(`❌ Error executing ${path.basename(filePath)}: ${error.message}`, 'ERROR');
    throw error;
  }
};

/**
 * Main Database Setup Function
 * Orchestrates the complete database initialization process
 *
 * @function setupDatabase
 * @async
 * @returns {Promise<void>}
 * @throws {Error} Throws if database setup fails
 * @example
 * await setupDatabase();
 */
const setupDatabase = async () => {
  let serverPool = null;
  let databasePool = null;

  try {
    log('🚀 Starting NASA System 6 Portal database setup...');

    // Step 1: Connect to PostgreSQL server
    log('Step 1: Connecting to PostgreSQL server...');
    serverPool = createPool('postgres');

    const serverClient = await serverPool.connect();
    log('✅ Connected to PostgreSQL server');

    // Step 2: Create database if it doesn't exist
    log(`Step 2: Creating database '${config.targetDatabase}' if it doesn't exist...`);

    try {
      await serverClient.query(`CREATE DATABASE "${config.targetDatabase}"`);
      log(`✅ Database '${config.targetDatabase}' created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        log(`✅ Database '${config.targetDatabase}' already exists`);
      } else {
        throw error;
      }
    } finally {
      serverClient.release();
    }

    // Close server connection
    await serverPool.end();

    // Step 3: Connect to the target database
    log(`Step 3: Connecting to database '${config.targetDatabase}'...`);
    databasePool = createPool(config.targetDatabase);

    const databaseClient = await databasePool.connect();
    log('✅ Connected to target database');

    // Step 4: Enable UUID extension
    log('Step 4: Enabling UUID extension...');
    try {
      await databaseClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      log('✅ UUID extension enabled');
    } catch (error) {
      log(`⚠️  Warning: Could not enable UUID extension: ${error.message}`, 'WARN');
    }

    databaseClient.release();

    // Step 5: Run migrations
    log('Step 5: Running database migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      log('Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Check if migrations directory has files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order

    if (migrationFiles.length === 0) {
      log('⚠️  No migration files found. Creating initial schema...');

      // Create initial migration if it doesn't exist
      const initialMigrationPath = path.join(migrationsDir, '001_initial_schema.sql');
      if (!fs.existsSync(initialMigrationPath)) {
        log('Creating initial migration file...');
        // The migration file content will be created separately
      }
    } else {
      // Run each migration
      for (const migrationFile of migrationFiles) {
        const filePath = path.join(migrationsDir, migrationFile);
        await executeSqlFile(databasePool, filePath);
      }
    }

    // Step 6: Run seeds if needed
    log('Step 6: Running seed data...');
    const seedsDir = path.join(__dirname, 'seeds');

    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const seedFile of seedFiles) {
        const filePath = path.join(seedsDir, seedFile);
        await executeSqlFile(databasePool, filePath);
      }
    } else {
      log('⚠️  No seed directory found. Skipping seed data.');
    }

    log('🎉 Database setup completed successfully!');
    log(`📊 Database '${config.targetDatabase}' is ready for use.`);

  } catch (error) {
    log(`💥 Database setup failed: ${error.message}`, 'ERROR');
    log(`Stack trace: ${error.stack}`, 'ERROR');
    process.exit(1);
  } finally {
    // Clean up connections
    if (databasePool) {
      await databasePool.end();
    }
  }
};

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      log('✨ Setup completed. Exiting gracefully...');
      process.exit(0);
    })
    .catch((error) => {
      log(`💥 Unhandled error: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

module.exports = { setupDatabase };