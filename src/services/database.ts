import * as SQLite from 'expo-sqlite';
import { Item, UsageRecord, CreateItemInput, UpdateItemInput, ItemWithUsage, DatabaseService, Group, CreateGroupInput, UpdateGroupInput, GroupWithItems } from '../types';

const DATABASE_NAME = 'price_per_use.db';
const DATABASE_VERSION = 3;

class DatabaseServiceImpl implements DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Set up PRAGMA settings
    await this.db.execAsync(`PRAGMA journal_mode = WAL;`);
    await this.db.execAsync(`PRAGMA foreign_keys = ON;`);
    
    // Create groups table first
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#6200EE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Check if items table exists and get its schema
    const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(items);`);
    const hasGroupId = tableInfo.some((col: any) => col.name === 'group_id');
    const hasColor = tableInfo.some((col: any) => col.name === 'color');

    if (tableInfo.length === 0) {
      // Create items table from scratch
      await this.db.execAsync(`
        CREATE TABLE items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          purchase_date TEXT NOT NULL,
          color TEXT NOT NULL DEFAULT '#6200EE',
          group_id INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL
        );
      `);
    } else {
      // Migrate existing table
      if (!hasColor) {
        await this.db.execAsync(`ALTER TABLE items ADD COLUMN color TEXT DEFAULT '#6200EE';`);
      }
      if (!hasGroupId) {
        await this.db.execAsync(`ALTER TABLE items ADD COLUMN group_id INTEGER;`);
      }
    }
    
    // Create usage_records table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        usage_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes
    await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_usage_records_item_id ON usage_records(item_id);`);
    await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_items_group_id ON items(group_id);`);

    // Remove any existing "Ungrouped" group since we'll handle null group_id as ungrouped
    await this.db.runAsync(`DELETE FROM groups WHERE name = 'Ungrouped';`);
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
      'INSERT INTO items (name, price, purchase_date, color, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item.name, item.price, item.purchase_date, item.color || '#6200EE', item.group_id || null, now, now]
    );

    const createdItem: Item = {
      id: result.lastInsertRowId,
      name: item.name,
      price: item.price,
      purchase_date: item.purchase_date,
      color: item.color || '#6200EE',
      group_id: item.group_id || null,
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
    if (updates.group_id !== undefined) {
      setParts.push('group_id = ?');
      values.push(updates.group_id);
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

  async createGroup(name: string, color?: string): Promise<Group> {
    const db = this.ensureDatabase();
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      'INSERT INTO groups (name, color, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [name, color || '#6200EE', now, now]
    );

    return {
      id: result.lastInsertRowId,
      name,
      color: color || '#6200EE',
      created_at: now,
      updated_at: now,
    };
  }

  async getGroups(): Promise<Group[]> {
    const db = this.ensureDatabase();
    const result = await db.getAllAsync('SELECT * FROM groups ORDER BY name ASC');
    return result as Group[];
  }

  async getGroupById(id: number): Promise<Group | null> {
    const db = this.ensureDatabase();
    const result = await db.getFirstAsync('SELECT * FROM groups WHERE id = ?', [id]);
    return result as Group | null;
  }

  async updateGroup(id: number, updates: UpdateGroupInput): Promise<void> {
    const db = this.ensureDatabase();
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      setParts.push('color = ?');
      values.push(updates.color);
    }
    
    setParts.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    await db.runAsync(
      `UPDATE groups SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteGroup(id: number): Promise<void> {
    const db = this.ensureDatabase();
    await db.runAsync('DELETE FROM groups WHERE id = ?', [id]);
  }

  async getItemsGroupedWithUsage(): Promise<GroupWithItems[]> {
    const db = this.ensureDatabase();
    
    // Get all groups with their items
    const groupedResult = await db.getAllAsync(`
      SELECT 
        g.id as group_id,
        g.name as group_name,
        g.color as group_color,
        i.id,
        i.name,
        i.price,
        i.purchase_date,
        i.color,
        i.created_at,
        i.updated_at,
        COUNT(ur.id) as usage_count
      FROM groups g
      LEFT JOIN items i ON g.id = i.group_id
      LEFT JOIN usage_records ur ON i.id = ur.item_id
      GROUP BY g.id, i.id
      ORDER BY g.name ASC, i.created_at DESC
    `);

    // Get ungrouped items (where group_id is NULL)
    const ungroupedResult = await db.getAllAsync(`
      SELECT 
        NULL as group_id,
        'Ungrouped' as group_name,
        '#6200EE' as group_color,
        i.id,
        i.name,
        i.price,
        i.purchase_date,
        i.color,
        i.created_at,
        i.updated_at,
        COUNT(ur.id) as usage_count
      FROM items i
      LEFT JOIN usage_records ur ON i.id = ur.item_id
      WHERE i.group_id IS NULL
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    const grouped: { [key: string]: any } = {};
    
    // Process grouped items
    groupedResult.forEach((row: any) => {
      const groupKey = `${row.group_id}_${row.group_name}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          group_id: row.group_id,
          group_name: row.group_name,
          group_color: row.group_color,
          items: []
        };
      }
      
      if (row.id) { // Only add if item exists
        const pricePerUse = row.usage_count > 0 ? row.price / row.usage_count : row.price;
        grouped[groupKey].items.push({
          id: row.id,
          name: row.name,
          price: row.price,
          purchase_date: row.purchase_date,
          color: row.color,
          group_id: row.group_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          usage_count: row.usage_count,
          price_per_use: pricePerUse,
        });
      }
    });

    // Process ungrouped items
    if (ungroupedResult.length > 0) {
      const ungroupedKey = 'null_Ungrouped';
      grouped[ungroupedKey] = {
        group_id: null,
        group_name: 'Ungrouped',
        group_color: '#6200EE',
        items: []
      };

      ungroupedResult.forEach((row: any) => {
        const pricePerUse = row.usage_count > 0 ? row.price / row.usage_count : row.price;
        grouped[ungroupedKey].items.push({
          id: row.id,
          name: row.name,
          price: row.price,
          purchase_date: row.purchase_date,
          color: row.color,
          group_id: null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          usage_count: row.usage_count,
          price_per_use: pricePerUse,
        });
      });
    }

    // Sort groups: Ungrouped first, then alphabetically
    const result = Object.values(grouped).sort((a: any, b: any) => {
      if (a.group_id === null) return -1; // Ungrouped first
      if (b.group_id === null) return 1;
      return a.group_name.localeCompare(b.group_name);
    });

    return result;
  }
}

export const databaseService = new DatabaseServiceImpl();
export default databaseService;