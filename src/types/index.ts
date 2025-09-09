export interface Group {
  id: number;
  name: string;
  color: string;         // Hex color code
  created_at: string;    // ISO 8601 format
  updated_at: string;    // ISO 8601 format
}

export interface Item {
  id: number;
  name: string;
  price: number;
  purchase_date: string; // ISO 8601 format
  color: string;         // Hex color code
  group_id: number | null;
  created_at: string;    // ISO 8601 format
  updated_at: string;    // ISO 8601 format
}

export interface UsageRecord {
  id: number;
  item_id: number;
  usage_date: string;    // ISO 8601 format
  created_at: string;    // ISO 8601 format
}

export interface CreateGroupInput {
  name: string;
  color?: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
}

export interface CreateItemInput {
  name: string;
  price: number;
  purchase_date: string;
  color?: string;
  group_id?: number | null;
}

export interface UpdateItemInput {
  name?: string;
  price?: number;
  purchase_date?: string;
  color?: string;
  group_id?: number | null;
}

export interface ItemWithUsage extends Item {
  usage_count: number;
  price_per_use: number;
}

export interface GroupWithItems {
  group_id: number | null;
  group_name: string;
  group_color: string;
  items: ItemWithUsage[];
}

export interface AppState {
  items: ItemWithUsage[];
  groups: Group[];
  groupedItems: GroupWithItems[];
  loading: boolean;
  error: string | null;
}

export interface AppActions {
  loadItems: () => Promise<void>;
  loadGroups: () => Promise<void>;
  loadGroupedItems: () => Promise<void>;
  addItem: (item: CreateItemInput) => Promise<void>;
  addGroup: (group: CreateGroupInput) => Promise<Group>;
  incrementUsage: (itemId: number) => Promise<void>;
  updateItem: (id: number, updates: UpdateItemInput) => Promise<void>;
  updateGroup: (id: number, updates: UpdateGroupInput) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
}

export interface DatabaseService {
  createItem(item: CreateItemInput): Promise<Item>;
  getItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | null>;
  updateItem(id: number, updates: UpdateItemInput): Promise<void>;
  deleteItem(id: number): Promise<void>;
  
  addUsage(itemId: number, usageDate?: string): Promise<void>;
  getUsageHistory(itemId: number): Promise<UsageRecord[]>;
  deleteUsageRecord(usageId: number): Promise<void>;
  
  getItemWithUsageCount(id: number): Promise<ItemWithUsage>;
  getAllItemsWithUsage(): Promise<ItemWithUsage[]>;
  
  createGroup(name: string, color?: string): Promise<Group>;
  getGroups(): Promise<Group[]>;
  getGroupById(id: number): Promise<Group | null>;
  updateGroup(id: number, updates: UpdateGroupInput): Promise<void>;
  deleteGroup(id: number): Promise<void>;
  getItemsGroupedWithUsage(): Promise<GroupWithItems[]>;
}