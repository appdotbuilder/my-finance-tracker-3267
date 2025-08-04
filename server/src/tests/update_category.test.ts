
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq, and } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCategoryId: number;
  let otherUserId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create another user for access control tests
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashed_password',
        name: 'Other User'
      })
      .returning()
      .execute();
    otherUserId = otherUserResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        user_id: testUserId,
        name: 'Original Category',
        type: 'expense',
        color: '#ff0000'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;
  });

  it('should update category name', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Updated Category Name'
    };

    const result = await updateCategory(testUserId, input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Updated Category Name');
    expect(result.type).toEqual('expense');
    expect(result.color).toEqual('#ff0000'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update category color', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      color: '#00ff00'
    };

    const result = await updateCategory(testUserId, input);

    expect(result.id).toEqual(testCategoryId);
    expect(result.name).toEqual('Original Category'); // Should remain unchanged
    expect(result.color).toEqual('#00ff00');
  });

  it('should update both name and color', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'New Name',
      color: '#0000ff'
    };

    const result = await updateCategory(testUserId, input);

    expect(result.name).toEqual('New Name');
    expect(result.color).toEqual('#0000ff');
  });

  it('should set color to null', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      color: null
    };

    const result = await updateCategory(testUserId, input);

    expect(result.color).toBeNull();
  });

  it('should persist changes to database', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Database Test',
      color: '#123456'
    };

    await updateCategory(testUserId, input);

    // Verify changes in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Database Test');
    expect(categories[0].color).toEqual('#123456');
  });

  it('should throw error for non-existent category', async () => {
    const input: UpdateCategoryInput = {
      id: 99999,
      name: 'Non-existent'
    };

    await expect(updateCategory(testUserId, input))
      .rejects
      .toThrow(/Category not found or access denied/i);
  });

  it('should throw error when user tries to update another users category', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Unauthorized Update'
    };

    await expect(updateCategory(otherUserId, input))
      .rejects
      .toThrow(/Category not found or access denied/i);
  });

  it('should not modify category when unauthorized access attempted', async () => {
    const input: UpdateCategoryInput = {
      id: testCategoryId,
      name: 'Unauthorized Update'
    };

    try {
      await updateCategory(otherUserId, input);
    } catch (error) {
      // Expected to throw
    }

    // Verify original category remains unchanged
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategoryId))
      .execute();

    expect(categories[0].name).toEqual('Original Category');
    expect(categories[0].color).toEqual('#ff0000');
  });
});
