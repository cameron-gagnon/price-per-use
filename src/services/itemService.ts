import { Item, UsageRecord, CreateItemInput, UpdateItemInput, ItemWithUsage } from '../types';
import databaseService from './database';

class ItemService {
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
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Item price must be greater than 0');
    }
    if (updates.color && !this.isValidHexColor(updates.color)) {
      throw new Error('Invalid color format. Please use hex color format (e.g., #FF0000)');
    }

    await databaseService.updateItem(id, updates);
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