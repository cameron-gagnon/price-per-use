import * as SQLite from 'expo-sqlite';
import { Item, UsageRecord, CreateItemInput, UpdateItemInput, ItemWithUsage, DatabaseService } from '../types';

const DATABASE_NAME = 'price_per_use.db';
const DATABASE_VERSION = 2;

class DatabaseServiceImpl implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#6200EE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        usage_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_usage_records_item_id ON usage_records(item_id);
      
      -- Add color column to existing items table if it doesn't exist
      ALTER TABLE items ADD COLUMN color TEXT DEFAULT '#6200EE';
    `).catch(() => {
      // Column already exists, ignore error
    });
  }

  private ensureDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return this.db;
  }

  async createItem(item: CreateItemInput): Promise<Item> {
    const db = this.ensureDatabase();
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      'INSERT INTO items (name, price, purchase_date, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [item.name, item.price, item.purchase_date, item.color || '#6200EE', now, now]
    );

    const createdItem: Item = {
      id: result.lastInsertRowId,
      name: item.name,
      price: item.price,
      purchase_date: item.purchase_date,
      color: item.color || '#6200EE',
      created_at: now,
      updated_at: now,
    };

    return createdItem;
  }

  async getItems(): Promise<Item[]> {
    const db = this.ensureDatabase();
    const result = await db.getAllAsync('SELECT * FROM items ORDER BY created_at DESC');
    return result as Item[];
  }

  async getItemById(id: number): Promise<Item | null> {
    const db = this.ensureDatabase();
    const result = await db.getFirstAsync('SELECT * FROM items WHERE id = ?', [id]);
    return result as Item | null;
  }

  async updateItem(id: number, updates: UpdateItemInput): Promise<void> {
    const db = this.ensureDatabase();
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.price !== undefined) {
      setParts.push('price = ?');
      values.push(updates.price);
    }
    if (updates.purchase_date !== undefined) {
      setParts.push('purchase_date = ?');
      values.push(updates.purchase_date);
    }
    if (updates.color !== undefined) {
      setParts.push('color = ?');
      values.push(updates.color);
    }
    
    setParts.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    await db.runAsync(
      `UPDATE items SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteItem(id: number): Promise<void> {
    const db = this.ensureDatabase();
    await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  }

  async addUsage(itemId: number, usageDate?: string): Promise<void> {
    const db = this.ensureDatabase();
    const now = new Date().toISOString();
    const usageDateTime = usageDate || now;
    
    await db.runAsync(
      'INSERT INTO usage_records (item_id, usage_date, created_at) VALUES (?, ?, ?)',
      [itemId, usageDateTime, now]
    );
  }

  async getUsageHistory(itemId: number): Promise<UsageRecord[]> {
    const db = this.ensureDatabase();
    const result = await db.getAllAsync(
      'SELECT * FROM usage_records WHERE item_id = ? ORDER BY usage_date DESC',
      [itemId]
    );
    return result as UsageRecord[];
  }

  async deleteUsageRecord(usageId: number): Promise<void> {
    const db = this.ensureDatabase();
    await db.runAsync('DELETE FROM usage_records WHERE id = ?', [usageId]);
  }

  async getItemWithUsageCount(id: number): Promise<ItemWithUsage> {
    const db = this.ensureDatabase();
    const result = await db.getFirstAsync(`
      SELECT 
        i.*,
        COUNT(ur.id) as usage_count
      FROM items i
      LEFT JOIN usage_records ur ON i.id = ur.item_id
      WHERE i.id = ?
      GROUP BY i.id
    `, [id]);

    if (!result) {
      throw new Error(`Item with id ${id} not found`);
    }

    const item = result as Item & { usage_count: number };
    const pricePerUse = item.usage_count > 0 ? item.price / item.usage_count : item.price;

    return {
      ...item,
      price_per_use: pricePerUse,
    } as ItemWithUsage;
  }

  async getAllItemsWithUsage(): Promise<ItemWithUsage[]> {
    const db = this.ensureDatabase();
    const result = await db.getAllAsync(`
      SELECT 
        i.*,
        COUNT(ur.id) as usage_count
      FROM items i
      LEFT JOIN usage_records ur ON i.id = ur.item_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    return result.map((item: any) => {
      const pricePerUse = item.usage_count > 0 ? item.price / item.usage_count : item.price;
      return {
        ...item,
        price_per_use: pricePerUse,
      } as ItemWithUsage;
    });
  }
}

export const databaseService = new DatabaseServiceImpl();
export default databaseService;