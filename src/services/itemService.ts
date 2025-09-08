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

    return await databaseService.createItem(itemData);
  }

  async updateItem(id: number, updates: UpdateItemInput): Promise<void> {
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Item name cannot be empty');
    }
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Item price must be greater than 0');
    }

    await databaseService.updateItem(id, updates);
  }

  async deleteItem(id: number): Promise<void> {
    await databaseService.deleteItem(id);
  }

  async incrementUsage(itemId: number): Promise<void> {
    const item = await databaseService.getItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    await databaseService.addUsage(itemId);
  }

  async getUsageHistory(itemId: number): Promise<UsageRecord[]> {
    return await databaseService.getUsageHistory(itemId);
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
}

export const itemService = new ItemService();
export default itemService;