
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCategory = async (userId: number, input: UpdateCategoryInput): Promise<Category> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      color: string | null;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    // Update category record - ensure user owns the category
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(and(
        eq(categoriesTable.id, input.id),
        eq(categoriesTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Category not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};
