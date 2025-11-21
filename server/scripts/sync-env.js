const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../.env');
const testEnvPath = path.join(__dirname, '../.env.test');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
const testEnvConfig = dotenv.parse(fs.readFileSync(testEnvPath));

const dbKeys = Object.keys(envConfig).filter(key => key.startsWith('DB_'));

if (dbKeys.length > 0) {
  console.log('Syncing DB variables from .env to .env.test');
  dbKeys.forEach(key => {
    if (envConfig[key]) {
      testEnvConfig[key] = envConfig[key];
      console.log(`Synced ${key}`);
    }
  });

  // Reconstruct .env.test content
  const newContent = Object.entries(testEnvConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(testEnvPath, newContent);
  console.log('Updated .env.test successfully.');
} else {
  console.log('No DB variables found in .env');
}
