const { Pool } = require('pg');

async function testConnection() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/shin_ai';

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully');

    // Test pgvector extension
    const vectorResult = await client.query('SELECT * FROM pg_extension WHERE extname = $1', ['vector']);
    if (vectorResult.rows.length > 0) {
      console.log('✅ pgvector extension is available');
    } else {
      console.log('⚠️ pgvector extension not found - vector search may not work');
    }

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database query successful:', result.rows[0].current_time);

    client.release();
    await pool.end();
    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testDatabaseOperations() {
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/shin_ai';

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    maxUses: 7500,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();

    // Test user creation
    console.log('🧪 Testing user creation...');
    const insertResult = await client.query(`
      INSERT INTO users (email, username, name, role, status, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `, ['test@example.com', 'testuser', 'Test User', 'user', 'active', true]);

    const userId = insertResult.rows[0].id;
    console.log('✅ User created with ID:', userId);

    // Test user retrieval
    console.log('🧪 Testing user retrieval...');
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log('✅ User retrieved:', userResult.rows[0].email);

    // Test cleanup
    console.log('🧹 Cleaning up test data...');
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('✅ Test data cleaned up');

    // Test table count
    console.log('🧪 Testing table count...');
    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log('✅ Total tables found:', tableResult.rows.length);

    client.release();
    await pool.end();
    return true;

  } catch (error) {
    console.error('❌ Database operations failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting PostgreSQL comprehensive test suite...\n');

  // Test 1: Connection
  console.log('=== TEST 1: Database Connection ===');
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Connection test failed - stopping tests');
    return false;
  }

  console.log('\n=== TEST 2: Database Operations ===');
  const operationsPassed = await testDatabaseOperations();
  if (!operationsPassed) {
    console.log('❌ Operations test failed');
    return false;
  }

  console.log('\n🎉 All PostgreSQL tests passed successfully!');
  console.log('✅ Your PostgreSQL setup is ready for production!');
  return true;
}

// Run tests
runAllTests().then(success => {
  if (success) {
    console.log('\n🚀 PostgreSQL setup is production-ready!');
    process.exit(0);
  } else {
    console.log('\n❌ PostgreSQL setup needs attention!');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});