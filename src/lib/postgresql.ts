import { Pool, PoolClient, QueryResult } from 'pg';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/shin_ai';

// Global database connection pool
let dbPool: Pool | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get PostgreSQL connection pool
 */
export function getDatabasePool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: DATABASE_URL,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    dbPool.on('error', (err, client) => {
      console.error('Unexpected error on idle client:', err);
    });

    // Handle connection events
    dbPool.on('connect', (client) => {
      console.log('New client connected to PostgreSQL');
    });

    console.log('📦 PostgreSQL connection pool initialized');
  }

  return dbPool;
}

/**
 * Get Drizzle ORM instance
 */
export function getDrizzleDb() {
  if (!drizzleDb) {
    const client = postgres(DATABASE_URL, {
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
    });
    drizzleDb = drizzle(client);
    console.log('🔧 Drizzle ORM initialized');
  }

  return drizzleDb;
}

/**
 * Get a database client for transactions
 */
export async function getDatabaseClient(): Promise<PoolClient> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  // Handle client errors
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });

  return client;
}

/**
 * Execute a query with automatic client management
 */
export async function executeQuery(
  query: string,
  params: any[] = []
): Promise<QueryResult> {
  const client = await getDatabaseClient();

  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction
 */
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDatabaseClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connections
 */
export async function closeDatabase(): Promise<void> {
  if (dbPool) {
    await dbPool.end();
    dbPool = null;
    console.log('🔌 PostgreSQL connection pool closed');
  }

  if (drizzleDb) {
    // Drizzle cleanup if needed
    drizzleDb = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL connection successful at:', result.rows[0].current_time);

    // Test pgvector extension
    try {
      await executeQuery('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension available');
    } catch (error) {
      console.warn('⚠️ pgvector extension not available:', error instanceof Error ? error.message : String(error));
    }

    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Initialize database schema
 */
export async function initializeDatabase(): Promise<void> {
  console.log('📦 Initializing PostgreSQL database...');

  try {
    // Create pgvector extension
    await executeQuery('CREATE EXTENSION IF NOT EXISTS vector');
    await executeQuery('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
    await executeQuery('CREATE EXTENSION IF NOT EXISTS uuid-ossp');

    // Create tables
    await createTables();

    // Create indexes
    await createIndexes();

    // Create RLS policies
    await createRLSPolicies();

    console.log('✅ PostgreSQL database schema initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Create all database tables with PostgreSQL features
 */
async function createTables(): Promise<void> {
  console.log('📋 Creating PostgreSQL tables...');

  // Users table with JSONB for flexible metadata
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar TEXT,
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'active',
      email_verified BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Auth table for authentication
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS auth (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(100) NOT NULL,
      provider_id VARCHAR(255) NOT NULL,
      password_hash TEXT,
      refresh_token TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(provider, provider_id)
    );
  `);

  // Chat sessions with vector support for embeddings
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      model VARCHAR(100),
      system_prompt TEXT,
      settings JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'active',
      embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 dimension
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Messages with full-text search
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      model VARCHAR(100),
      tokens INTEGER,
      metadata JSONB DEFAULT '{}',
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Files with metadata storage
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size BIGINT NOT NULL,
      path TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Documents with full-text search
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      type VARCHAR(100),
      metadata JSONB DEFAULT '{}',
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Knowledge base with vector search
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      tags TEXT[],
      metadata JSONB DEFAULT '{}',
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // AI models configuration
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS models (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      provider VARCHAR(100) NOT NULL,
      model_id VARCHAR(255) NOT NULL,
      config JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Prompt templates
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS prompts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(100),
      tags TEXT[],
      is_public BOOLEAN DEFAULT false,
      usage_count INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Custom functions
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS functions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      language VARCHAR(50) DEFAULT 'javascript',
      is_active BOOLEAN DEFAULT true,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // System tools
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS tools (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      type VARCHAR(100) NOT NULL,
      config JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // User groups
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      permissions JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Group memberships
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS group_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
  `);

  // File organization
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS folders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Chat channels
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS channels (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'public',
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Channel memberships
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS channel_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(channel_id, user_id)
    );
  `);

  // System configuration
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'string',
      category VARCHAR(100),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // User feedback
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      metadata JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Chat memory and context
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chat_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      importance REAL DEFAULT 0.5,
      metadata JSONB DEFAULT '{}',
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Content tags
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) UNIQUE NOT NULL,
      color VARCHAR(7), -- Hex color code
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Content tagging relationships
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS content_tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      content_type VARCHAR(100) NOT NULL,
      content_id UUID NOT NULL,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(content_type, content_id, tag_id)
    );
  `);

  // API keys management
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_hash TEXT UNIQUE NOT NULL,
      permissions JSONB DEFAULT '{}',
      expires_at TIMESTAMPTZ,
      last_used_at TIMESTAMPTZ,
      usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Usage tracking
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
      event_type VARCHAR(100) NOT NULL,
      endpoint TEXT,
      method VARCHAR(10),
      status_code INTEGER,
      response_time INTEGER,
      tokens_used INTEGER,
      cost DECIMAL(10,6),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ All PostgreSQL tables created successfully');
}

/**
 * Create database indexes for performance
 */
async function createIndexes(): Promise<void> {
  console.log('📈 Creating PostgreSQL indexes...');

  // Users indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);');

  // Auth indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_auth_user_id ON auth(user_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_auth_provider ON auth(provider, provider_id);');

  // Chat sessions indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);');

  // Messages indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);');

  // Vector indexes for similarity search
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_chat_sessions_embedding ON chat_sessions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_files_embedding ON files USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);');

  // Full-text search indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_messages_content_fts ON messages USING gin (to_tsvector(\'english\', content));');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents USING gin (to_tsvector(\'english\', content));');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_knowledge_content_fts ON knowledge USING gin (to_tsvector(\'english\', content));');

  // JSONB indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING gin (metadata);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_chat_sessions_metadata ON chat_sessions USING gin (metadata);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_files_metadata ON files USING gin (metadata);');

  // Group indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);');

  // Channel indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);');

  // API keys indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);');

  // Usage events indexes
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_usage_events_api_key_id ON usage_events(api_key_id);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);');
  await executeQuery('CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);');

  console.log('✅ All PostgreSQL indexes created successfully');
}

/**
 * Create Row Level Security policies
 */
async function createRLSPolicies(): Promise<void> {
  console.log('🔒 Creating RLS policies...');

  // Enable RLS on all tables
  const tables = [
    'users', 'auth', 'chat_sessions', 'messages', 'files', 'documents',
    'knowledge', 'models', 'prompts', 'functions', 'tools', 'groups',
    'group_members', 'folders', 'channels', 'channel_members', 'config',
    'feedback', 'memories', 'tags', 'content_tags', 'api_keys', 'usage_events'
  ];

  for (const table of tables) {
    await executeQuery(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
  }

  // Users can only access their own data
  await executeQuery(`
    CREATE POLICY "users_own_data" ON users
    FOR ALL USING (auth.uid() = id);
  `);

  await executeQuery(`
    CREATE POLICY "users_own_auth" ON auth
    FOR ALL USING (auth.uid() = user_id);
  `);

  await executeQuery(`
    CREATE POLICY "users_own_chat_sessions" ON chat_sessions
    FOR ALL USING (auth.uid() = user_id);
  `);

  console.log('✅ RLS policies created successfully');
}

// Export types
export type { Pool, PoolClient, QueryResult } from 'pg';