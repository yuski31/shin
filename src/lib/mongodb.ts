import mongoose from 'mongoose';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shin_ai';

// Global mongoose cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache for mongoose connection
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

/**
 * Connect to MongoDB using Mongoose
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  // Return pending promise if connection is in progress
  if (!cached.promise) {
    console.log('🔄 Creating new MongoDB connection...');

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  // Store in global cache for development
  if (process.env.NODE_ENV === 'development') {
    global.mongoose = cached;
  }

  return cached.conn;
}

/**
 * Test MongoDB connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await connectDB();
    console.log('✅ MongoDB connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    return false;
  }
}

/**
 * Close MongoDB connection
 */
export async function closeConnection(): Promise<void> {
  try {
    if (cached.conn) {
      await cached.conn.disconnect();
      cached.conn = null;
      cached.promise = null;
      console.log('🔌 MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
}

/**
 * Get database connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  name: string;
  host: string;
} {
  const connection = mongoose.connection;

  return {
    isConnected: connection.readyState === 1,
    readyState: connection.readyState,
    name: connection.name || 'Not connected',
    host: connection.host || 'Not connected',
  };
}

// Export the connectDB function as default
export default connectDB;

// Export as named export for compatibility
export { connectDB as connectToDatabase };

// Export mongoose for direct use if needed
export { mongoose };