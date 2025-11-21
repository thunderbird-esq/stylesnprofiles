# Database Setup Guide

## PostgreSQL Installation and Configuration

### Current Status
PostgreSQL is installed but requires password authentication which is blocking automated database creation.

### Manual Setup Steps

#### 1. Configure PostgreSQL for Local Development

Option A: Use trust authentication for local development (less secure, development only):

```bash
# Find your pg_hba.conf file
/opt/homebrew/var/postgresql@14/pg_hba.conf

# Edit the file and change:
# local   all             all                                     md5
# TO:
# local   all             all                                     trust

# Restart PostgreSQL
brew services restart postgresql@14
```

Option B: Set a password for your PostgreSQL user:

```bash
# Start psql with postgres user
psql postgres

# In psql, set a password:
ALTER USER edsaga WITH PASSWORD 'your_password';
\q

# Update your .env file with the password
```

#### 2. Create Development Database

```bash
createdb nasa_system6_portal

# Initialize the schema
cd server
node -e "require('./db').initDb()"
```

#### 3. Create Test Database

```bash
createdb nasa_system6_portal_test

# The test environment will use .env.test credentials
```

#### 4. Verify Database Connection

```bash
# Test development database
psql nasa_system6_portal -c "SELECT 1;"

# Test test database
psql nasa_system6_portal_test -c "SELECT 1;"
```

### Environment Variables

Make sure your `.env` file in the server directory has the correct credentials:

```bash
DB_USER=edsaga  # or postgres
DB_HOST=localhost
DB_DATABASE=nasa_system6_portal
DB_PASSWORD=your_password  # if using password auth
DB_PORT=5432
```

### Testing

After setup, verify everything works:

```bash
# Run database tests
cd server
npm test -- __tests__/db.integration.test.js
```

### Troubleshooting

**Error: "password authentication failed"**
- Check that your .env password matches your PostgreSQL user password
- Or switch to trust authentication for local development

**Error: "database does not exist"**
- Run `createdb nasa_system6_portal` and `createdb nasa_system6_portal_test`

**Error: "connection to server failed"**
- Ensure PostgreSQL is running: `brew services list`
- Start it if needed: `brew services start postgresql@14`
