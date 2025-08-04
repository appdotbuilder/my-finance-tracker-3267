
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

const testCategory = {
  name: 'Food',
  type: 'expense' as const,
  color: '#ff0000'
};

describe('createTransaction', () => {
  let userId: number;
  let categoryId: number;
  let testInput: CreateTransactionInput;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        ...testCategory,
        user_id: userId
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create fresh test input for each test
    testInput = {
      category_id: categoryId,
      amount: 50.75,
      description: 'Lunch at restaurant',
      transaction_date: '2024-01-15'
    };
  });

  afterEach(resetDB);

  it('should create a transaction', async () => {
    const result = await createTransaction(userId, testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.category_id).toEqual(categoryId);
    expect(result.amount).toEqual(50.75);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Lunch at restaurant');
    expect(result.transaction_date).toBeInstanceOf(Date);
    expect(result.transaction_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save transaction to database', async () => {
    const result = await createTransaction(userId, testInput);

    // Query database to verify the transaction was saved
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const savedTransaction = transactions[0];
    
    expect(savedTransaction.user_id).toEqual(userId);
    expect(savedTransaction.category_id).toEqual(categoryId);
    expect(parseFloat(savedTransaction.amount)).toEqual(50.75);
    expect(savedTransaction.description).toEqual('Lunch at restaurant');
    expect(savedTransaction.transaction_date).toBeInstanceOf(Date);
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
    expect(savedTransaction.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithoutDescription: CreateTransactionInput = {
      category_id: categoryId,
      amount: 25.00,
      transaction_date: '2024-01-16'
    };

    const result = await createTransaction(userId, inputWithoutDescription);

    expect(result.description).toBeNull();
    expect(result.amount).toEqual(25.00);
  });

  it('should throw error for non-existent category', async () => {
    const invalidInput: CreateTransactionInput = {
      category_id: 99999, // Non-existent category ID
      amount: 100.00,
      description: 'Test transaction',
      transaction_date: '2024-01-15'
    };

    await expect(createTransaction(userId, invalidInput)).rejects.toThrow(/category not found/i);
  });

  it('should throw error for category belonging to different user', async () => {
    // Create another user
    const otherUserResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'other_hash',
        name: 'Other User'
      })
      .returning()
      .execute();
    const otherUserId = otherUserResult[0].id;

    // Create category for other user
    const otherCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Other Category',
        type: 'income',
        user_id: otherUserId
      })
      .returning()
      .execute();
    const otherCategoryId = otherCategoryResult[0].id;

    const invalidInput: CreateTransactionInput = {
      category_id: otherCategoryId,
      amount: 100.00,
      description: 'Unauthorized transaction',
      transaction_date: '2024-01-15'
    };

    await expect(createTransaction(userId, invalidInput)).rejects.toThrow(/category not found/i);
  });

  it('should throw error for invalid date format', async () => {
    const invalidInput: CreateTransactionInput = {
      category_id: categoryId,
      amount: 50.00,
      description: 'Test transaction',
      transaction_date: 'invalid-date'
    };

    await expect(createTransaction(userId, invalidInput)).rejects.toThrow(/invalid transaction date/i);
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CreateTransactionInput = {
      category_id: categoryId,
      amount: 123.45, // Use 2 decimal places to match PostgreSQL numeric(15,2) precision
      description: 'Precise amount',
      transaction_date: '2024-01-15'
    };

    const result = await createTransaction(userId, decimalInput);

    expect(result.amount).toEqual(123.45);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const savedTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(savedTransaction[0].amount)).toEqual(123.45);
  });
});
