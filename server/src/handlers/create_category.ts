
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

export async function createCategory(userId: number, input: CreateCategoryInput): Promise<Category> {
  try {
    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        user_id: userId,
        name: input.name,
        type: input.type,
        color: input.color || null
      })
      .returning()
      .execute();

    // Return the created category
    const category = result[0];
    return {
      ...category,
      created_at: category.created_at
    };
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
}
