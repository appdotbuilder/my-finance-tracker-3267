
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type UpdateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq, and } from 'drizzle-orm';

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCategoryId: number;
  let otherCategoryId: number;
  let transactionId: number;
  let otherUserId: number;
  let otherUserCategoryId: number;

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

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        {
          user_id: testUserId,
          name: 'Food',
          type: 'expense'
        },
        {
          user_id: testUserId,
          name: 'Salary',
          type: 'income'
        },
        {
          user_id: otherUserId,
          name: 'Other Food',
          type: 'expense'
        }
      ])
      .returning()
      .execute();

    testCategoryId = categories[0].id;
    otherCategoryId = categories[1].id;
    otherUserCategoryId = categories[2].id;

    // Create test transaction
    const transactions = await db.insert(transactionsTable)
      .values({
        user_id: testUserId,
        category_id: testCategoryId,
        amount: '50.00',
        description: 'Original description',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();

    transactionId = transactions[0].id;
  });

  it('should update transaction amount', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 75.50
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.amount).toEqual(75.50);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction category', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      category_id: otherCategoryId
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.category_id).toEqual(otherCategoryId);
    expect(result.amount).toEqual(50); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction description', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      description: 'Updated description'
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.description).toEqual('Updated description');
    expect(result.amount).toEqual(50); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update transaction date', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      transaction_date: '2024-02-20'
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.transaction_date).toEqual(new Date('2024-02-20'));
    expect(result.amount).toEqual(50); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 125.75,
      category_id: otherCategoryId,
      description: 'Multiple updates',
      transaction_date: '2024-03-10'
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.amount).toEqual(125.75);
    expect(result.category_id).toEqual(otherCategoryId);
    expect(result.description).toEqual('Multiple updates');
    expect(result.transaction_date).toEqual(new Date('2024-03-10'));
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 99.99,
      description: 'Database test'
    };

    await updateTransaction(testUserId, input);

    // Verify changes in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(parseFloat(transactions[0].amount)).toEqual(99.99);
    expect(transactions[0].description).toEqual('Database test');
    expect(transactions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent transaction', async () => {
    const input: UpdateTransactionInput = {
      id: 99999,
      amount: 100
    };

    expect(updateTransaction(testUserId, input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error when user tries to update another user\'s transaction', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      amount: 100
    };

    expect(updateTransaction(otherUserId, input)).rejects.toThrow(/not found or access denied/i);
  });

  it('should throw error for invalid category_id', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      category_id: 99999
    };

    expect(updateTransaction(testUserId, input)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should throw error when trying to use another user\'s category', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      category_id: otherUserCategoryId
    };

    expect(updateTransaction(testUserId, input)).rejects.toThrow(/category not found or access denied/i);
  });

  it('should handle null description update', async () => {
    const input: UpdateTransactionInput = {
      id: transactionId,
      description: null
    };

    const result = await updateTransaction(testUserId, input);

    expect(result.id).toEqual(transactionId);
    expect(result.description).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
