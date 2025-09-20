import { getDatabasePool, executeQuery, executeTransaction } from './postgresql';
import {
  User,
  ChatSession,
  Message,
  File,
  Document,
  Knowledge,
  Model,
  Prompt,
  Function,
  Tool,
  Group,
  GroupMember,
  Folder,
  Channel,
  ChannelMember,
  Config,
  Feedback,
  Memory,
  Tag,
  ContentTag,
  ApiKey,
  UsageEvent,
  Organization,
  COLLECTIONS,
  DatabaseResult,
  PaginatedResult,
  QueryFilters,
  QueryOptions,
  UpdateData,
  VectorSearchOptions,
  FullTextSearchOptions
} from '@/types/postgresql';

// Generic database service class for PostgreSQL
export class DatabaseService<T extends { id: string; created_at: string; updated_at: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Create a new record
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<T>> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')}, created_at, updated_at)
        VALUES (${placeholders}, NOW(), NOW())
        RETURNING *
      `;

      const result = await executeQuery(query, values);

      return {
        success: true,
        data: result.rows[0] as T
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Find records with pagination
  async find(
    filters: QueryFilters = {},
    options: QueryOptions = {}
  ): Promise<DatabaseResult<PaginatedResult<T>>> {
    try {
      const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;

      // Build WHERE clause
      const whereConditions = this.buildWhereClause(filters);
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const countResult = await executeQuery(countQuery, this.getFilterValues(filters));
      const total = parseInt(countResult.rows[0].total);

      // Get data
      const dataQuery = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${this.getFilterValues(filters).length + 1} OFFSET $${this.getFilterValues(filters).length + 2}
      `;

      const dataResult = await executeQuery(dataQuery, [
        ...this.getFilterValues(filters),
        limit,
        offset
      ]);

      const hasNext = offset + limit < total;
      const hasPrev = offset > 0;

      return {
        success: true,
        data: {
          data: dataResult.rows as T[],
          total,
          page: Math.floor(offset / limit) + 1,
          limit,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Find one record
  async findOne(filters: QueryFilters = {}): Promise<DatabaseResult<T | null>> {
    try {
      const whereConditions = this.buildWhereClause(filters);
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
      const result = await executeQuery(query, this.getFilterValues(filters));

      return {
        success: true,
        data: result.rows[0] as T | null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Find by ID
  async findById(id: string): Promise<DatabaseResult<T | null>> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await executeQuery(query, [id]);

      return {
        success: true,
        data: result.rows[0] as T | null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Update record
  async update(
    filters: QueryFilters,
    updateData: UpdateData
  ): Promise<DatabaseResult<T | null>> {
    try {
      const whereConditions = this.buildWhereClause(filters);
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const updateFields = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      const values = [...Object.values(updateData), ...this.getFilterValues(filters)];

      const query = `
        UPDATE ${this.tableName}
        SET ${updateFields}, updated_at = NOW()
        ${whereClause}
        RETURNING *
      `;

      const result = await executeQuery(query, values);

      return {
        success: true,
        data: result.rows[0] as T | null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Update by ID
  async updateById(id: string, updateData: UpdateData): Promise<DatabaseResult<T | null>> {
    try {
      return await this.update({ id }, updateData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete record
  async delete(filters: QueryFilters): Promise<DatabaseResult<boolean>> {
    try {
      const whereConditions = this.buildWhereClause(filters);
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `DELETE FROM ${this.tableName} ${whereClause}`;
      const result = await executeQuery(query, this.getFilterValues(filters));

      return {
        success: true,
        data: (result.rowCount || 0) > 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Delete by ID
  async deleteById(id: string): Promise<DatabaseResult<boolean>> {
    try {
      return await this.delete({ id });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Count records
  async count(filters: QueryFilters = {}): Promise<DatabaseResult<number>> {
    try {
      const whereConditions = this.buildWhereClause(filters);
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
      const result = await executeQuery(query, this.getFilterValues(filters));

      return {
        success: true,
        data: parseInt(result.rows[0].count)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Vector search (for tables with embedding columns)
  async vectorSearch(options: VectorSearchOptions): Promise<DatabaseResult<T[]>> {
    try {
      const { vector, limit = 10, threshold = 0.5, filter = {} } = options;

      const whereConditions = this.buildWhereClause(filter);
      const filterConditions = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT *,
               1 - (embedding <=> $1::vector) as similarity
        FROM ${this.tableName}
        WHERE embedding IS NOT NULL
        ${filterConditions}
        ORDER BY embedding <=> $1::vector
        LIMIT $${whereConditions.length + 2}
      `;

      const values = [JSON.stringify(vector), ...this.getFilterValues(filter), limit];
      const result = await executeQuery(query, values);

      const filteredResults = result.rows.filter((row: any) => row.similarity >= threshold);

      return {
        success: true,
        data: filteredResults as T[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Full-text search (for tables with tsvector columns)
  async fullTextSearch(options: FullTextSearchOptions): Promise<DatabaseResult<T[]>> {
    try {
      const { query, limit = 10, filter = {}, highlight = false } = options;

      const whereConditions = this.buildWhereClause(filter);
      const filterConditions = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

      let selectClause = '*';
      if (highlight) {
        selectClause = `
          *,
          ts_headline('english', content, plainto_tsquery('english', $1)) as highlighted_content
        `;
      }

      const searchQuery = `
        SELECT ${selectClause}
        FROM ${this.tableName}
        WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
        ${filterConditions}
        ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) DESC
        LIMIT $${whereConditions.length + 2}
      `;

      const values = [query, ...this.getFilterValues(filter), limit];
      const result = await executeQuery(searchQuery, values);

      return {
        success: true,
        data: result.rows as T[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Helper method to build WHERE clause
  private buildWhereClause(filters: QueryFilters): string[] {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          conditions.push(`${key} = ANY($${conditions.length + 1})`);
        } else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${key} ILIKE $${conditions.length + 1}`);
        } else {
          conditions.push(`${key} = $${conditions.length + 1}`);
        }
      }
    }

    return conditions;
  }

  // Helper method to get filter values in correct order
  private getFilterValues(filters: QueryFilters): any[] {
    const values: any[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        values.push(value);
      }
    }

    return values;
  }
}

// Specific service instances
export const userService = new DatabaseService<User>(COLLECTIONS.USERS);
export const chatSessionService = new DatabaseService<ChatSession>(COLLECTIONS.CHAT_SESSIONS);
export const messageService = new DatabaseService<Message>(COLLECTIONS.MESSAGES);
export const fileService = new DatabaseService<File>(COLLECTIONS.FILES);
export const documentService = new DatabaseService<Document>(COLLECTIONS.DOCUMENTS);
export const knowledgeService = new DatabaseService<Knowledge>(COLLECTIONS.KNOWLEDGE);
export const modelService = new DatabaseService<Model>(COLLECTIONS.MODELS);
export const promptService = new DatabaseService<Prompt>(COLLECTIONS.PROMPTS);
export const functionService = new DatabaseService<Function>(COLLECTIONS.FUNCTIONS);
export const toolService = new DatabaseService<Tool>(COLLECTIONS.TOOLS);
export const groupService = new DatabaseService<Group>(COLLECTIONS.GROUPS);
export const groupMemberService = new DatabaseService<GroupMember>(COLLECTIONS.GROUP_MEMBERS);
export const folderService = new DatabaseService<Folder>(COLLECTIONS.FOLDERS);
export const channelService = new DatabaseService<Channel>(COLLECTIONS.CHANNELS);
export const channelMemberService = new DatabaseService<ChannelMember>(COLLECTIONS.CHANNEL_MEMBERS);
export const configService = new DatabaseService<Config>(COLLECTIONS.CONFIG);
export const feedbackService = new DatabaseService<Feedback>(COLLECTIONS.FEEDBACK);
export const memoryService = new DatabaseService<Memory>(COLLECTIONS.MEMORIES);
export const tagService = new DatabaseService<Tag>(COLLECTIONS.TAGS);
export const contentTagService = new DatabaseService<ContentTag>(COLLECTIONS.CONTENT_TAGS);
export const apiKeyService = new DatabaseService<ApiKey>(COLLECTIONS.API_KEYS);
export const usageEventService = new DatabaseService<UsageEvent>(COLLECTIONS.USAGE_EVENTS);
export const organizationService = new DatabaseService<Organization>(COLLECTIONS.ORGANIZATIONS);

// Helper functions for common operations
export async function initializeDatabase(): Promise<void> {
  try {
    const pool = getDatabasePool();

    // Test connection
    await pool.query('SELECT NOW()');

    // Initialize schema
    const { initializeDatabase: initDb } = await import('./postgresql');
    await initDb();

    console.log('✅ PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL database:', error);
    throw error;
  }
}

// Export PostgreSQL functions for direct use
export {
  getDatabasePool,
  executeQuery,
  executeTransaction,
  testConnection,
  closeDatabase
} from './postgresql';