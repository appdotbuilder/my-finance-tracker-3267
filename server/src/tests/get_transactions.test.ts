
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type DateRangeFilter } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCategoryId: number;
  let otherUserId: number;

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
        type: 'expense'
      })
      .returning()
      .execute();

    testCategoryId = categories[0].id;

    // Create test transactions with different dates
    await db.insert(transactionsTable)
      .values([
        {
          user_id: testUserId,
          category_id: testCategoryId,
          amount: '100.50',
          description: 'Transaction 1',
          transaction_date: new Date('2024-01-15T10:00:00Z')
        },
        {
          user_id: testUserId,
          category_id: testCategoryId,
          amount: '75.25',
          description: 'Transaction 2',
          transaction_date: new Date('2024-01-20T14:30:00Z')
        },
        {
          user_id: testUserId,
          category_id: testCategoryId,
          amount: '200.00',
          description: 'Transaction 3',
          transaction_date: new Date('2024-02-05T09:15:00Z')
        },
        {
          user_id: otherUserId,
          category_id: testCategoryId,
          amount: '50.00',
          description: 'Other user transaction',
          transaction_date: new Date('2024-01-18T12:00:00Z')
        }
      ])
      .execute();
  });

  it('should get all transactions for user without filter', async () => {
    const result = await getTransactions(testUserId);

    expect(result).toHaveLength(3);
    
    // Should be ordered by transaction_date descending (most recent first)
    expect(result[0].description).toEqual('Transaction 3');
    expect(result[1].description).toEqual('Transaction 2');
    expect(result[2].description).toEqual('Transaction 1');

    // Verify numeric conversion
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toEqual(200.00);
    expect(result[1].amount).toEqual(75.25);
    expect(result[2].amount).toEqual(100.50);

    // Verify all belong to test user
    result.forEach(transaction => {
      expect(transaction.user_id).toEqual(testUserId);
    });
  });

  it('should filter transactions by date range', async () => {
    const filter: DateRangeFilter = {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    };

    const result = await getTransactions(testUserId, filter);

    expect(result).toHaveLength(2);
    expect(result[0].description).toEqual('Transaction 2');
    expect(result[1].description).toEqual('Transaction 1');

    // Verify all transactions are within date range
    result.forEach(transaction => {
      const transactionDate = new Date(transaction.transaction_date);
      expect(transactionDate >= new Date('2024-01-01')).toBe(true);
      expect(transactionDate <= new Date('2024-01-31T23:59:59.999Z')).toBe(true);
    });
  });

  it('should return empty array when no transactions in date range', async () => {
    const filter: DateRangeFilter = {
      start_date: '2024-03-01',
      end_date: '2024-03-31'
    };

    const result = await getTransactions(testUserId, filter);

    expect(result).toHaveLength(0);
  });

  it('should only return transactions for specified user', async () => {
    const result = await getTransactions(testUserId);

    expect(result).toHaveLength(3);
    
    // Verify no transactions from other user
    result.forEach(transaction => {
      expect(transaction.user_id).toEqual(testUserId);
      expect(transaction.user_id).not.toEqual(otherUserId);
    });
  });

  it('should return empty array for user with no transactions', async () => {
    // Create a new user with no transactions
    const newUser = await db.insert(usersTable)
      .values({
        email: 'newuser@example.com',
        password_hash: 'hash789',
        name: 'New User'
      })
      .returning()
      .execute();

    const result = await getTransactions(newUser[0].id);

    expect(result).toHaveLength(0);
  });

  it('should handle single day date range correctly', async () => {
    const filter: DateRangeFilter = {
      start_date: '2024-01-20',
      end_date: '2024-01-20'
    };

    const result = await getTransactions(testUserId, filter);

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual('Transaction 2');
    
    const transactionDate = new Date(result[0].transaction_date);
    expect(transactionDate.toDateString()).toEqual(new Date('2024-01-20').toDateString());
  });
});
