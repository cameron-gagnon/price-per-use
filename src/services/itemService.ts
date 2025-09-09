import { Item, UsageRecord, CreateItemInput, UpdateItemInput, ItemWithUsage, Group, CreateGroupInput, UpdateGroupInput, GroupWithItems } from '../types';
import databaseService from './database';

class ItemService {
  // Character limits
  static readonly MAX_ITEM_NAME_LENGTH = 50;
  static readonly MAX_GROUP_NAME_LENGTH = 30;

  async initialize(): Promise<void> {
    await databaseService.initializeDatabase();
  }

  async getAllItemsWithUsage(): Promise<ItemWithUsage[]> {
    return await databaseService.getAllItemsWithUsage();
  }

  async getItemWithUsage(id: number): Promise<ItemWithUsage> {
    return await databaseService.getItemWithUsageCount(id);
  }

  async createItem(itemData: CreateItemInput): Promise<Item> {
    if (!itemData.name.trim()) {
      throw new Error('Item name is required');
    }
    if (itemData.name.trim().length > ItemService.MAX_ITEM_NAME_LENGTH) {
      throw new Error(`Item name must be ${ItemService.MAX_ITEM_NAME_LENGTH} characters or less`);
    }
    if (itemData.price <= 0) {
      throw new Error('Item price must be greater than 0');
    }
    if (!itemData.purchase_date) {
      throw new Error('Purchase date is required');
    }
    if (itemData.color && !this.isValidHexColor(itemData.color)) {
      throw new Error('Invalid color format. Please use hex color format (e.g., #FF0000)');
    }

    return await databaseService.createItem(itemData);
  }

  async updateItem(id: number, updates: UpdateItemInput): Promise<void> {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Item name cannot be empty');
    }
    if (updates.name !== undefined && updates.name.trim().length > ItemService.MAX_ITEM_NAME_LENGTH) {
      throw new Error(`Item name must be ${ItemService.MAX_ITEM_NAME_LENGTH} characters or less`);
    }
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Item price must be greater than 0');
    }
    if (updates.color && !this.isValidHexColor(updates.color)) {
      throw new Error('Invalid color format. Please use hex color format (e.g., #FF0000)');
    }

    await databaseService.updateItem(id, updates);
  }

  async getAllGroups(): Promise<Group[]> {
    return await databaseService.getGroups();
  }

  async getGroup(id: number): Promise<Group | null> {
    return await databaseService.getGroupById(id);
  }

  async createGroup(groupData: CreateGroupInput): Promise<Group> {
    if (!groupData.name.trim()) {
      throw new Error('Group name is required');
    }
    if (groupData.name.trim().length > ItemService.MAX_GROUP_NAME_LENGTH) {
      throw new Error(`Group name must be ${ItemService.MAX_GROUP_NAME_LENGTH} characters or less`);
    }
    if (groupData.color && !this.isValidHexColor(groupData.color)) {
      throw new Error('Invalid color format. Please use hex color format (e.g., #FF0000)');
    }

    return await databaseService.createGroup(groupData.name, groupData.color);
  }

  async updateGroup(id: number, updates: UpdateGroupInput): Promise<void> {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Group name cannot be empty');
    }
    if (updates.name !== undefined && updates.name.trim().length > ItemService.MAX_GROUP_NAME_LENGTH) {
      throw new Error(`Group name must be ${ItemService.MAX_GROUP_NAME_LENGTH} characters or less`);
    }
    if (updates.color && !this.isValidHexColor(updates.color)) {
      throw new Error('Invalid color format. Please use hex color format (e.g., #FF0000)');
    }

    await databaseService.updateGroup(id, updates);
  }

  async deleteGroup(id: number): Promise<void> {
    await databaseService.deleteGroup(id);
  }

  async getItemsGroupedWithUsage(): Promise<GroupWithItems[]> {
    return await databaseService.getItemsGroupedWithUsage();
  }

  async deleteItem(id: number): Promise<void> {
    await databaseService.deleteItem(id);
  }

  async incrementUsage(itemId: number, usageDate?: string): Promise<void> {
    const item = await databaseService.getItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    await databaseService.addUsage(itemId, usageDate);
  }

  async getUsageHistory(itemId: number): Promise<UsageRecord[]> {
    return await databaseService.getUsageHistory(itemId);
  }

  async deleteUsageRecord(usageId: number): Promise<void> {
    await databaseService.deleteUsageRecord(usageId);
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  calculatePricePerUse(price: number, usageCount: number): number {
    return usageCount > 0 ? price / usageCount : price;
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }
}

export const itemService = new ItemService();
export default itemService;