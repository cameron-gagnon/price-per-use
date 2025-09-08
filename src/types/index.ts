export interface Item {
  id: number;
  name: string;
  price: number;
  purchase_date: string; // ISO 8601 format
  color: string;         // Hex color code
  created_at: string;    // ISO 8601 format
  updated_at: string;    // ISO 8601 format
}

export interface UsageRecord {
  id: number;
  item_id: number;
  usage_date: string;    // ISO 8601 format
  created_at: string;    // ISO 8601 format
}

export interface CreateItemInput {
  name: string;
  price: number;
  purchase_date: string;
  color?: string;
}

export interface UpdateItemInput {
  name?: string;
  price?: number;
  purchase_date?: string;
  color?: string;
}

export interface ItemWithUsage extends Item {
  usage_count: number;
  price_per_use: number;
}

export interface AppState {
  items: ItemWithUsage[];
  loading: boolean;
  error: string | null;
}

export interface AppActions {
  loadItems: () => Promise<void>;
  addItem: (item: CreateItemInput) => Promise<void>;
  incrementUsage: (itemId: number) => Promise<void>;
  updateItem: (id: number, updates: UpdateItemInput) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}

export interface DatabaseService {
  createItem(item: CreateItemInput): Promise<Item>;
  getItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | null>;
  updateItem(id: number, updates: UpdateItemInput): Promise<void>;
  deleteItem(id: number): Promise<void>;
  
  addUsage(itemId: number): Promise<void>;
  getUsageHistory(itemId: number): Promise<UsageRecord[]>;
  
  getItemWithUsageCount(id: number): Promise<ItemWithUsage>;
  getAllItemsWithUsage(): Promise<ItemWithUsage[]>;
}