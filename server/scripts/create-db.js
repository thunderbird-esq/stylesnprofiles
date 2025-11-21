require('dotenv').config();
const { Client } = require('pg');

const createDb = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default 'postgres' db to create new db
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await client.connect();
    console.log('Connected to postgres database.');

    // Check if database exists
    const checkRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'nasa_system6_portal'",
    );

    if (checkRes.rows.length === 0) {
      console.log('Creating database "nasa_system6_portal"...');
      await client.query('CREATE DATABASE nasa_system6_portal');
      console.log('Database created successfully.');
    } else {
      console.log('Database "nasa_system6_portal" already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createDb();
