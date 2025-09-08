# App Architecture & Data Model

## Data Model

### Items Table
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  purchase_date TEXT NOT NULL, -- ISO 8601 format
  created_at TEXT NOT NULL,    -- ISO 8601 format
  updated_at TEXT NOT NULL     -- ISO 8601 format
);
```

### Usage Records Table
```sql
CREATE TABLE usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  usage_date TEXT NOT NULL,    -- ISO 8601 format
  created_at TEXT NOT NULL,    -- ISO 8601 format
  FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);
```

## Calculated Fields
- **Total Usage Count**: COUNT of usage_records for each item
- **Price Per Use**: item.price / usage_count (with fallback to original price if 0 uses)

## App Structure

```
src/
├── components/
│   ├── ItemCard.tsx           # Main item display component
│   ├── ItemDetails.tsx        # Expanded item view with history
│   ├── AddItemForm.tsx        # Form for adding new items
│   └── EditItemForm.tsx       # Form for editing existing items
├── screens/
│   ├── HomeScreen.tsx         # Main list of items
│   ├── AddItemScreen.tsx      # Screen for adding items
│   └── ItemDetailScreen.tsx   # Detailed view of single item
├── services/
│   ├── database.ts           # SQLite database operations
│   └── itemService.ts        # Business logic for items
├── types/
│   └── index.ts              # TypeScript interfaces
├── hooks/
│   └── useItems.ts           # Custom hook for item operations
└── App.tsx                   # Main app component
```

## Screen Flow

1. **Home Screen** (Main List)
   - Display all items as cards
   - Show: name, price per use
   - Tap item → increment usage
   - Long press → item details
   - FAB → Add new item

2. **Add Item Screen**
   - Form: name, price, purchase date
   - Save → return to home

3. **Item Detail Screen**
   - Show all item information
   - Usage history (dates)
   - Edit/Delete buttons

## Component Specifications

### ItemCard Component
```typescript
interface ItemCardProps {
  item: Item;
  onUsageIncrement: (itemId: number) => void;
  onLongPress: (item: Item) => void;
}
```

**Display:**
- Item name (large text)
- Price per use (prominent, calculated)
- Subtle indicator of total uses
- Tap area covers entire card

### ItemDetails Component
```typescript
interface ItemDetailsProps {
  item: Item;
  usageHistory: UsageRecord[];
  onEdit: (item: Item) => void;
  onDelete: (itemId: number) => void;
}
```

**Expandable sections:**
- Basic info (always visible)
- Usage history (collapsible)
- Actions (edit/delete)

## Database Service Interface

```typescript
interface DatabaseService {
  // Item operations
  createItem(item: CreateItemInput): Promise<Item>;
  getItems(): Promise<Item[]>;
  getItemById(id: number): Promise<Item | null>;
  updateItem(id: number, updates: UpdateItemInput): Promise<void>;
  deleteItem(id: number): Promise<void>;

  // Usage operations
  addUsage(itemId: number): Promise<void>;
  getUsageHistory(itemId: number): Promise<UsageRecord[]>;

  // Calculated queries
  getItemWithUsageCount(id: number): Promise<ItemWithUsage>;
  getAllItemsWithUsage(): Promise<ItemWithUsage[]>;
}
```

## State Management

Using React Context for global state:

```typescript
interface AppState {
  items: ItemWithUsage[];
  loading: boolean;
  error: string | null;
}

interface AppActions {
  loadItems: () => Promise<void>;
  addItem: (item: CreateItemInput) => Promise<void>;
  incrementUsage: (itemId: number) => Promise<void>;
  updateItem: (id: number, updates: UpdateItemInput) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
}
```

## User Experience Flow

1. **First Launch**: Empty state with onboarding hint
2. **Add First Item**: Guide user through form
3. **Main Usage**:
   - Quick tap to increment usage
   - Visual feedback with brief "popping" animation on tap
   - Price per use updates immediately
4. **Item Management**:
   - Long press for details
   - Swipe actions for quick delete
   - Pull to refresh
