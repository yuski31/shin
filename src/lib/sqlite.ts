import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'database.sqlite');

// Global database instance
let db: Database.Database | null = null;

/**
 * Get SQLite database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Create database directory if it doesn't exist
    const fs = require('fs');
    const dbDir = path.dirname(DB_PATH);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database
    db = new Database(DB_PATH);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log('📦 SQLite database initialized at:', DB_PATH);
  }

  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔌 SQLite database connection closed');
  }
}

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  const db = getDatabase();

  // Create tables
  createTables(db);

  // Create indexes
  createIndexes(db);

  console.log('✅ SQLite database schema initialized');
}

/**
 * Create all database tables
 */
function createTables(db: Database.Database): void {
  // Auth table - User authentication credentials
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      password_hash TEXT,
      refresh_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_id)
    );
  `);

  // User table - User profiles and account information
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      email_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Chat table - Chat sessions and metadata
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      model TEXT,
      system_prompt TEXT,
      settings TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Message table - Individual chat messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
      tokens INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE
    );
  `);

  // File table - Uploaded files and metadata
  db.exec(`
    CREATE TABLE IF NOT EXISTS file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Document table - Documents for knowledge management
  db.exec(`
    CREATE TABLE IF NOT EXISTS document (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Knowledge table - Knowledge base entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Model table - AI model configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS model (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      config TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Prompt table - AI prompt templates
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      is_public BOOLEAN DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Function table - Custom functions and configurations
  db.exec(`
    CREATE TABLE IF NOT EXISTS function (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL,
      language TEXT DEFAULT 'javascript',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Tool table - System tools and integrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS tool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      config TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Group table - User groups and permissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS group (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Group members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES group(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    );
  `);

  // Folder table - File/content organization
  db.exec(`
    CREATE TABLE IF NOT EXISTS folder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folder(id) ON DELETE CASCADE
    );
  `);

  // Channel table - Chat channels
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'public',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL
    );
  `);

  // Channel members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channel(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      UNIQUE(channel_id, user_id)
    );
  `);

  // Config table - System-wide configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Feedback table - User feedback and ratings
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      rating INTEGER,
      metadata TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Memory table - Chat history and context
  db.exec(`
    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chat_id INTEGER,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance REAL DEFAULT 0.5,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (chat_id) REFERENCES chat(id) ON DELETE CASCADE
    );
  `);

  // Tag table - Content categorization
  db.exec(`
    CREATE TABLE IF NOT EXISTS tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Content tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
      UNIQUE(content_type, content_id, tag_id)
    );
  `);

  // API keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_key (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      key_hash TEXT UNIQUE NOT NULL,
      permissions TEXT,
      expires_at DATETIME,
      last_used_at DATETIME,
      usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
  `);

  // Usage events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_event (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      api_key_id INTEGER,
      event_type TEXT NOT NULL,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      response_time INTEGER,
      tokens_used INTEGER,
      cost REAL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (api_key_id) REFERENCES api_key(id) ON DELETE CASCADE
    );
  `);
}

/**
 * Create database indexes for better performance
 */
function createIndexes(db: Database.Database): void {
  // User indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_user_status ON user(status);');

  // Chat indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_status ON chat(status);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat(created_at);');

  // Message indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_chat_id ON message(chat_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_role ON message(role);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_message_created_at ON message(created_at);');

  // Auth indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_auth_user_id ON auth(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_auth_provider ON auth(provider, provider_id);');

  // File indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_file_user_id ON file(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_file_created_at ON file(created_at);');

  // Document indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_document_user_id ON document(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_document_type ON document(type);');

  // Knowledge indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON knowledge(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);');

  // Model indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_model_provider ON model(provider);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_model_is_active ON model(is_active);');

  // Function indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_function_user_id ON function(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_function_is_active ON function(is_active);');

  // Group indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_group_member_group_id ON group_member(group_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_group_member_user_id ON group_member(user_id);');

  // Channel indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_channel_member_channel_id ON channel_member(channel_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_channel_member_user_id ON channel_member(user_id);');

  // Memory indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_memory_user_id ON memory(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_memory_chat_id ON memory(chat_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_memory_type ON memory(type);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_memory_importance ON memory(importance);');

  // Tag indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_content_tag_content ON content_tag(content_type, content_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_content_tag_tag ON content_tag(tag_id);');

  // API key indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_key_user_id ON api_key(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_key_is_active ON api_key(is_active);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_api_key_expires_at ON api_key(expires_at);');

  // Usage event indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_usage_event_user_id ON usage_event(user_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_usage_event_api_key_id ON usage_event(api_key_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_usage_event_event_type ON usage_event(event_type);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_usage_event_created_at ON usage_event(created_at);');
}

// Export types
export type { Database } from 'better-sqlite3';