
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq, and } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let otherUserId: number;
  let categoryId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'test@example.com',
          password_hash: 'hash123',
          name: 'Test User'
        },
        {
          email: 'other@example.com',
          password_hash: 'hash456',
          name: 'Other User'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    otherUserId = users[1].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        user_id: testUserId,
        name: 'Test Category',
        type: 'expense',
        color: '#FF5733'
      })
      .returning()
      .execute();

    categoryId = categories[0].id;
  });

  it('should delete category successfully', async () => {
    const result = await deleteCategory(testUserId, categoryId);

    expect(result.success).toBe(true);

    // Verify category is deleted from database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999999;

    expect(async () => {
      await deleteCategory(testUserId, nonExistentId);
    }).toThrow(/Category not found or access denied/i);
  });

  it('should throw error when user does not own the category', async () => {
    expect(async () => {
      await deleteCategory(otherUserId, categoryId);
    }).toThrow(/Category not found or access denied/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should throw error when category has existing transactions', async () => {
    // Create a transaction for the category
    await db.insert(transactionsTable)
      .values({
        user_id: testUserId,
        category_id: categoryId,
        amount: '50.00',
        description: 'Test transaction',
        transaction_date: new Date()
      })
      .execute();

    expect(async () => {
      await deleteCategory(testUserId, categoryId);
    }).toThrow(/Cannot delete category with existing transactions/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should delete category when it has no transactions', async () => {
    // Ensure no transactions exist for this category
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, categoryId))
      .execute();

    expect(transactions).toHaveLength(0);

    const result = await deleteCategory(testUserId, categoryId);

    expect(result.success).toBe(true);

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });
});
