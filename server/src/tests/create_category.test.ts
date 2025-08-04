
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

const testIncomeInput: CreateCategoryInput = {
  name: 'Salary',
  type: 'income',
  color: '#4CAF50'
};

const testExpenseInput: CreateCategoryInput = {
  name: 'Groceries',
  type: 'expense',
  color: '#F44336'
};

describe('createCategory', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create an income category', async () => {
    const result = await createCategory(userId, testIncomeInput);

    // Basic field validation
    expect(result.name).toEqual('Salary');
    expect(result.type).toEqual('income');
    expect(result.color).toEqual('#4CAF50');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an expense category', async () => {
    const result = await createCategory(userId, testExpenseInput);

    // Basic field validation
    expect(result.name).toEqual('Groceries');
    expect(result.type).toEqual('expense');
    expect(result.color).toEqual('#F44336');
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create category with null color when not provided', async () => {
    const inputWithoutColor: CreateCategoryInput = {
      name: 'Transport',
      type: 'expense'
    };

    const result = await createCategory(userId, inputWithoutColor);

    expect(result.name).toEqual('Transport');
    expect(result.type).toEqual('expense');
    expect(result.color).toBeNull();
    expect(result.user_id).toEqual(userId);
  });

  it('should save category to database', async () => {
    const result = await createCategory(userId, testIncomeInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Salary');
    expect(categories[0].type).toEqual('income');
    expect(categories[0].color).toEqual('#4CAF50');
    expect(categories[0].user_id).toEqual(userId);
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories for same user', async () => {
    await createCategory(userId, testIncomeInput);
    await createCategory(userId, testExpenseInput);

    // Query all categories for the user
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.user_id, userId))
      .execute();

    expect(categories).toHaveLength(2);
    
    const incomeCategory = categories.find(c => c.type === 'income');
    const expenseCategory = categories.find(c => c.type === 'expense');
    
    expect(incomeCategory?.name).toEqual('Salary');
    expect(expenseCategory?.name).toEqual('Groceries');
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 99999;
    
    await expect(createCategory(nonExistentUserId, testIncomeInput))
      .rejects.toThrow(/violates foreign key constraint/i);
  });
});
