import { testConnection, initializeDatabase } from './postgresql';

/**
 * Test PostgreSQL connection and initialize database
 */
export async function testPostgreSQLConnection(): Promise<void> {
  console.log('🧪 Testing PostgreSQL connection...');

  try {
    // Test basic connection
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to PostgreSQL');
      console.log('💡 Make sure to:');
      console.log('1. Update DATABASE_URL in .env.local with your actual PostgreSQL connection string');
      console.log('2. Ensure your PostgreSQL server is running');
      console.log('3. Check your network connection and credentials');
      return;
    }

    console.log('✅ PostgreSQL connection successful');

    // Initialize database schema
    console.log('📦 Initializing database schema...');
    await initializeDatabase();

    console.log('✅ Database setup completed successfully!');
    console.log('🎉 You can now use PostgreSQL with your Next.js application');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

// Export for use in other files
export { testConnection, initializeDatabase };