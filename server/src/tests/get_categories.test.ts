
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return categories for the specified user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test categories for the user
    await db.insert(categoriesTable)
      .values([
        {
          user_id: userId,
          name: 'Food',
          type: 'expense',
          color: '#FF5733'
        },
        {
          user_id: userId,
          name: 'Salary',
          type: 'income',
          color: '#33FF57'
        }
      ])
      .execute();

    const result = await getCategories(userId);

    expect(result).toHaveLength(2);
    
    // Check first category
    const foodCategory = result.find(c => c.name === 'Food');
    expect(foodCategory).toBeDefined();
    expect(foodCategory!.type).toBe('expense');
    expect(foodCategory!.color).toBe('#FF5733');
    expect(foodCategory!.user_id).toBe(userId);
    expect(foodCategory!.created_at).toBeInstanceOf(Date);

    // Check second category
    const salaryCategory = result.find(c => c.name === 'Salary');
    expect(salaryCategory).toBeDefined();
    expect(salaryCategory!.type).toBe('income');
    expect(salaryCategory!.color).toBe('#33FF57');
    expect(salaryCategory!.user_id).toBe(userId);
    expect(salaryCategory!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no categories', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const result = await getCategories(userId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return categories for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        name: 'User 1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        name: 'User 2'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create categories for both users
    await db.insert(categoriesTable)
      .values([
        {
          user_id: user1Id,
          name: 'User 1 Food',
          type: 'expense',
          color: '#FF5733'
        },
        {
          user_id: user2Id,
          name: 'User 2 Food',
          type: 'expense',
          color: '#33FF57'
        },
        {
          user_id: user1Id,
          name: 'User 1 Salary',
          type: 'income',
          color: null
        }
      ])
      .execute();

    // Get categories for user 1
    const user1Categories = await getCategories(user1Id);

    expect(user1Categories).toHaveLength(2);
    user1Categories.forEach(category => {
      expect(category.user_id).toBe(user1Id);
    });

    const categoryNames = user1Categories.map(c => c.name);
    expect(categoryNames).toContain('User 1 Food');
    expect(categoryNames).toContain('User 1 Salary');
    expect(categoryNames).not.toContain('User 2 Food');
  });

  it('should handle categories with null color', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create category with null color
    await db.insert(categoriesTable)
      .values({
        user_id: userId,
        name: 'Miscellaneous',
        type: 'expense',
        color: null
      })
      .execute();

    const result = await getCategories(userId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Miscellaneous');
    expect(result[0].color).toBeNull();
    expect(result[0].type).toBe('expense');
  });
});
