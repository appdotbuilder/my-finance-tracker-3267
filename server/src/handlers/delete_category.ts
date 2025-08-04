
import { db } from '../db';
import { categoriesTable, transactionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCategory(userId: number, categoryId: number): Promise<{ success: boolean }> {
  try {
    // First, check if the category exists and belongs to the user
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(and(
        eq(categoriesTable.id, categoryId),
        eq(categoriesTable.user_id, userId)
      ))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error('Category not found or access denied');
    }

    // Check if category has any transactions
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .limit(1)
      .execute();

    if (transactions.length > 0) {
      throw new Error('Cannot delete category with existing transactions');
    }

    // Delete the category
    const result = await db.delete(categoriesTable)
      .where(and(
        eq(categoriesTable.id, categoryId),
        eq(categoriesTable.user_id, userId)
      ))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
