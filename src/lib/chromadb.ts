import { ChromaClient, Collection, Where, WhereDocument } from 'chromadb';
import { getDatabasePool, executeQuery } from './postgresql';

// ChromaDB configuration
const CHROMADB_HOST = process.env.CHROMADB_HOST || 'localhost';
const CHROMADB_PORT = parseInt(process.env.CHROMADB_PORT || '8000');
const CHROMADB_URL = `http://${CHROMADB_HOST}:${CHROMADB_PORT}`;

// Global ChromaDB client
let chromaClient: ChromaClient | null = null;

/**
 * Get ChromaDB client instance
 */
export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      path: CHROMADB_URL,
    });
    console.log('🔗 ChromaDB client initialized at:', CHROMADB_URL);
  }

  return chromaClient;
}

/**
 * Initialize ChromaDB collections
 */
export async function initializeChromaDB(): Promise<void> {
  console.log('🗂️ Initializing ChromaDB collections...');

  const client = getChromaClient();

  try {
    // Create collections for different content types
    const collections = [
      {
        name: 'chat_sessions',
        metadata: {
          description: 'Chat session embeddings for similarity search',
          dimension: 1536, // OpenAI text-embedding-ada-002
        }
      },
      {
        name: 'messages',
        metadata: {
          description: 'Message embeddings for context retrieval',
          dimension: 1536,
        }
      },
      {
        name: 'documents',
        metadata: {
          description: 'Document embeddings for knowledge retrieval',
          dimension: 1536,
        }
      },
      {
        name: 'knowledge',
        metadata: {
          description: 'Knowledge base embeddings for semantic search',
          dimension: 1536,
        }
      },
      {
        name: 'memories',
        metadata: {
          description: 'User memory embeddings for personalization',
          dimension: 1536,
        }
      }
    ];

    for (const collectionConfig of collections) {
      try {
        // Check if collection exists
        const existingCollections = await client.listCollections();
        const collectionExists = existingCollections.some((c: any) => c.name === collectionConfig.name);

        if (!collectionExists) {
          await client.createCollection({
            name: collectionConfig.name,
            metadata: collectionConfig.metadata,
          });
          console.log(`✅ Created ChromaDB collection: ${collectionConfig.name}`);
        } else {
          console.log(`✅ ChromaDB collection already exists: ${collectionConfig.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create collection ${collectionConfig.name}:`, error);
      }
    }

    console.log('✅ ChromaDB collections initialized');
  } catch (error) {
    console.error('❌ ChromaDB initialization failed:', error);
    throw error;
  }
}

/**
 * Add embeddings to ChromaDB collection
 */
export async function addEmbeddings(
  collectionName: string,
  embeddings: number[][],
  documents: string[],
  metadatas: Record<string, any>[] = [],
  ids: string[] = []
): Promise<string[]> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: collectionName });

    // Generate IDs if not provided
    const finalIds = ids.length > 0 ? ids : embeddings.map((_, index) => `${collectionName}_${Date.now()}_${index}`);

    await collection.add({
      ids: finalIds,
      embeddings: embeddings,
      documents: documents,
      metadatas: metadatas,
    });

    console.log(`✅ Added ${embeddings.length} embeddings to ${collectionName}`);
    return finalIds;
  } catch (error) {
    console.error(`❌ Failed to add embeddings to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Search for similar embeddings in ChromaDB
 */
export async function searchSimilar(
  collectionName: string,
  queryEmbedding: number[],
  nResults: number = 5,
  where?: Where,
  whereDocument?: WhereDocument
): Promise<{
  ids: string[][];
  embeddings: number[][][];
  documents: string[][];
  metadatas: Record<string, any>[][];
  distances: number[][];
}> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: collectionName });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
      where: where,
      whereDocument: whereDocument,
    });

    return {
      ids: results.ids,
      embeddings: results.embeddings,
      documents: results.documents,
      metadatas: results.metadatas,
      distances: results.distances || [],
    };
  } catch (error) {
    console.error(`❌ Failed to search in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update embeddings in ChromaDB collection
 */
export async function updateEmbeddings(
  collectionName: string,
  ids: string[],
  embeddings?: number[][],
  documents?: string[],
  metadatas?: Record<string, any>[]
): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: collectionName });

    await collection.update({
      ids: ids,
      embeddings: embeddings,
      documents: documents,
      metadatas: metadatas,
    });

    console.log(`✅ Updated ${ids.length} embeddings in ${collectionName}`);
  } catch (error) {
    console.error(`❌ Failed to update embeddings in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete embeddings from ChromaDB collection
 */
export async function deleteEmbeddings(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: collectionName });

    await collection.delete({
      ids: ids,
    });

    console.log(`✅ Deleted ${ids.length} embeddings from ${collectionName}`);
  } catch (error) {
    console.error(`❌ Failed to delete embeddings from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(collectionName: string): Promise<{
  count: number;
  metadata: Record<string, any>;
}> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: collectionName });

    const count = await collection.count();
    const metadata = collection.metadata || {};

    return {
      count,
      metadata,
    };
  } catch (error) {
    console.error(`❌ Failed to get stats for ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Sync PostgreSQL data with ChromaDB embeddings
 */
export async function syncWithPostgreSQL(): Promise<void> {
  console.log('🔄 Syncing PostgreSQL data with ChromaDB...');

  try {
    // Sync chat sessions
    await syncChatSessions();

    // Sync messages
    await syncMessages();

    // Sync documents
    await syncDocuments();

    // Sync knowledge
    await syncKnowledge();

    // Sync memories
    await syncMemories();

    console.log('✅ ChromaDB sync completed');
  } catch (error) {
    console.error('❌ ChromaDB sync failed:', error);
    throw error;
  }
}

/**
 * Sync chat sessions with ChromaDB
 */
async function syncChatSessions(): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: 'chat_sessions' });

    // Get chat sessions with embeddings from PostgreSQL
    const result = await executeQuery(`
      SELECT id, title, content, embedding
      FROM chat_sessions
      WHERE embedding IS NOT NULL
    `);

    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      const embeddings = result.rows.map(row => row.embedding);
      const documents = result.rows.map(row => row.title);

      await collection.upsert({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
      });

      console.log(`✅ Synced ${result.rows.length} chat sessions`);
    }
  } catch (error) {
    console.error('❌ Failed to sync chat sessions:', error);
  }
}

/**
 * Sync messages with ChromaDB
 */
async function syncMessages(): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: 'messages' });

    // Get messages with embeddings from PostgreSQL
    const result = await executeQuery(`
      SELECT id, content, embedding
      FROM messages
      WHERE embedding IS NOT NULL
    `);

    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      const embeddings = result.rows.map(row => row.embedding);
      const documents = result.rows.map(row => row.content);

      await collection.upsert({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
      });

      console.log(`✅ Synced ${result.rows.length} messages`);
    }
  } catch (error) {
    console.error('❌ Failed to sync messages:', error);
  }
}

/**
 * Sync documents with ChromaDB
 */
async function syncDocuments(): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: 'documents' });

    // Get documents with embeddings from PostgreSQL
    const result = await executeQuery(`
      SELECT id, title, content, embedding
      FROM documents
      WHERE embedding IS NOT NULL
    `);

    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      const embeddings = result.rows.map(row => row.embedding);
      const documents = result.rows.map(row => `${row.title}: ${row.content || ''}`);

      await collection.upsert({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
      });

      console.log(`✅ Synced ${result.rows.length} documents`);
    }
  } catch (error) {
    console.error('❌ Failed to sync documents:', error);
  }
}

/**
 * Sync knowledge with ChromaDB
 */
async function syncKnowledge(): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: 'knowledge' });

    // Get knowledge entries with embeddings from PostgreSQL
    const result = await executeQuery(`
      SELECT id, title, content, embedding
      FROM knowledge
      WHERE embedding IS NOT NULL
    `);

    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      const embeddings = result.rows.map(row => row.embedding);
      const documents = result.rows.map(row => `${row.title}: ${row.content}`);

      await collection.upsert({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
      });

      console.log(`✅ Synced ${result.rows.length} knowledge entries`);
    }
  } catch (error) {
    console.error('❌ Failed to sync knowledge:', error);
  }
}

/**
 * Sync memories with ChromaDB
 */
async function syncMemories(): Promise<void> {
  const client = getChromaClient();

  try {
    const collection = await client.getCollection({ name: 'memories' });

    // Get memories with embeddings from PostgreSQL
    const result = await executeQuery(`
      SELECT id, content, embedding
      FROM memories
      WHERE embedding IS NOT NULL
    `);

    if (result.rows.length > 0) {
      const ids = result.rows.map(row => row.id);
      const embeddings = result.rows.map(row => row.embedding);
      const documents = result.rows.map(row => row.content);

      await collection.upsert({
        ids: ids,
        embeddings: embeddings,
        documents: documents,
      });

      console.log(`✅ Synced ${result.rows.length} memories`);
    }
  } catch (error) {
    console.error('❌ Failed to sync memories:', error);
  }
}

/**
 * Close ChromaDB connection
 */
export async function closeChromaDB(): Promise<void> {
  if (chromaClient) {
    // ChromaDB cleanup if needed
    chromaClient = null;
    console.log('🔌 ChromaDB connection closed');
  }
}

// Export ChromaDB types
export type { ChromaClient, Collection };