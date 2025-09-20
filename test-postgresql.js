const { testConnection, initializeDatabase } = require('./src/lib/postgresql.ts');

async function testPostgreSQLSetup() {
  console.log('🧪 Testing PostgreSQL setup...');

  try {
    // Test basic connection
    console.log('1️⃣ Testing database connection...');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Database connection failed');
      console.log('💡 Make sure PostgreSQL is running and accessible');
      console.log('💡 Check your DATABASE_URL in .env.local');
      return false;
    }

    console.log('✅ Database connection successful');

    // Test database initialization
    console.log('2️⃣ Testing database initialization...');
    await initializeDatabase();
    console.log('✅ Database initialization successful');

    // Test basic operations
    console.log('3️⃣ Testing basic database operations...');

    // Test user creation
    const { executeQuery } = require('./src/lib/postgresql.ts');
    const result = await executeQuery(`
      INSERT INTO users (email, username, name, role, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['test@example.com', 'testuser', 'Test User', 'user', 'active', true]);

    console.log('✅ User created with ID:', result.rows[0].id);

    // Test user retrieval
    const userResult = await executeQuery('SELECT * FROM users WHERE id = $1', [result.rows[0].id]);
    console.log('✅ User retrieved:', userResult.rows[0]);

    // Test cleanup
    await executeQuery('DELETE FROM users WHERE id = $1', [result.rows[0].id]);
    console.log('🧹 Test data cleaned up');

    // Test table count
    const tableResult = await executeQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log('✅ Total tables created:', tableResult.rows.length);

    console.log('🎉 PostgreSQL setup test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ PostgreSQL setup test failed:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check your DATABASE_URL configuration');
    console.log('3. Ensure the database user has proper permissions');
    console.log('4. Verify pgvector extension is available');
    return false;
  }
}

// Run the test
testPostgreSQLSetup().then(success => {
  if (success) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});