# Database Setup Guide

## Overview
This guide covers setting up PostgreSQL as the primary database with ChromaDB for vector storage and RAG functionality. PostgreSQL is recommended for production applications due to its ACID compliance, advanced features, and better performance at scale.

## PostgreSQL Setup (Primary Database - Recommended for Production)

### Prerequisites
- PostgreSQL installed locally or cloud instance
- pgvector extension for vector search capabilities
- ChromaDB for RAG functionality (optional, can run separately)

### Installation
```bash
# Install PostgreSQL client and ORM
npm install pg drizzle-orm postgres-js

# Install ChromaDB client for vector storage
npm install chromadb
```

### Configuration
Update your `.env.local` file with your PostgreSQL connection string:

```env
# PostgreSQL Configuration (Primary Database)
DATABASE_URL=postgresql://username:password@localhost:5432/shin_ai

# Optional: Individual PostgreSQL connection parameters
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=shin_ai
# DB_USER=username
# DB_PASSWORD=password
# DB_SSL=false

# Connection Pool Settings (for production)
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_IDLE=10000
DB_POOL_TIMEOUT=30000

# ChromaDB Configuration (for RAG functionality)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
```

### PostgreSQL Setup Steps

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Create Database and User**:
   ```sql
   -- Connect to PostgreSQL as superuser
   sudo -u postgres psql

   -- Create database
   CREATE DATABASE shin_ai;

   -- Create user
   CREATE USER shin_user WITH PASSWORD 'your_secure_password';

   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE shin_ai TO shin_user;
   ```

3. **Enable Required Extensions**:
   ```sql
   -- Connect to your database
   \c shin_ai;

   -- Enable pgvector extension for vector search
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Enable other useful extensions
   CREATE EXTENSION IF NOT EXISTS uuid-ossp;
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   ```

4. **Run Database Initialization**:
   ```bash
   # Compile TypeScript and run initialization
   npx tsc
   node -e "require('./dist/lib/postgresql.js').initializeDatabase()"
   ```

### ChromaDB Setup (Optional - for RAG functionality)

1. **Install ChromaDB**:
   ```bash
   # Using Docker (recommended)
   docker run -p 8000:8000 chromadb/chroma

   # Or install locally
   pip install chromadb
   chroma run --host 0.0.0.0 --port 8000
   ```

2. **Verify ChromaDB Connection**:
   ```bash
   curl http://localhost:8000/api/v1/heartbeat
   ```

### Testing PostgreSQL Connection
```bash
node test-postgresql.js
```

## Cloud Database Setup (Recommended for Production)

### Supabase (Recommended for Next.js)
1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Go to Settings > Database
4. Copy connection string
5. Enable pgvector extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS uuid-ossp;
   ```

### Neon (PostgreSQL as a Service)
1. Go to [Neon](https://neon.tech)
2. Create new project
3. Copy connection string
4. Enable pgvector extension in the dashboard

### AWS RDS
1. Create PostgreSQL instance in RDS
2. Enable pgvector extension
3. Configure security groups
4. Get connection string

## Environment Configuration Examples

### Development (.env.local)
```env
# PostgreSQL Configuration
DATABASE_URL=postgresql://shin_user:your_password@localhost:5432/shin_ai

# ChromaDB Configuration (optional)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
```

### Production (.env)
```env
# Use connection pooling for production
DATABASE_URL=postgresql://shin_user:your_password@your-host.com:5432/shin_ai

# Connection pooling settings
DB_POOL_MIN=5
DB_POOL_MAX=50
DB_POOL_IDLE=30000
DB_POOL_TIMEOUT=60000

# SSL required for production
DB_SSL=true

# ChromaDB for production (use cloud instance)
CHROMADB_HOST=your-chromadb-host.com
CHROMADB_PORT=8000
```

## Vector Storage with ChromaDB

The application uses ChromaDB for vector storage and RAG functionality:

- **Chat Sessions**: Embeddings for similarity search
- **Messages**: Context retrieval for conversations
- **Documents**: Knowledge retrieval
- **Memories**: User personalization

ChromaDB automatically syncs with PostgreSQL data for optimal performance.

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if database server is running
   - Verify connection string and credentials
   - Check firewall settings

2. **Authentication Failed**:
   - Verify username and password
   - Check database user permissions

3. **pgvector Extension Not Found**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **Port Already in Use**:
   - Check if another service is using the port
   - Change port in configuration

5. **ChromaDB Connection Issues**:
   - Verify ChromaDB is running
   - Check CHROMADB_HOST and CHROMADB_PORT
   - Test with: `curl http://localhost:8000/api/v1/heartbeat`

### Testing Commands

```bash
# Test PostgreSQL connection
node test-postgresql.js

# Check database status
psql -h localhost -U shin_user -d shin_ai -c "SELECT version();"

# Check pgvector extension
psql -h localhost -U shin_user -d shin_ai -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Test ChromaDB connection
curl http://localhost:8000/api/v1/heartbeat
```

## Next Steps

1. Update your `.env.local` file with the correct PostgreSQL connection string
2. Run the PostgreSQL test script
3. Verify ChromaDB is running (if using RAG features)
4. Update your application code to use PostgreSQL services
5. Set up connection pooling for production (PgBouncer recommended)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your connection string and credentials
3. Test with a simple database client
4. Check logs for detailed error messages
5. Ensure all required extensions are installed