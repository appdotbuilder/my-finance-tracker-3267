
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a transaction owned by the user', async () => {
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

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        user_id: userId,
        name: 'Food',
        type: 'expense'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        category_id: categoryId,
        amount: '50.00',
        description: 'Lunch',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const transactionId = transactionResult[0].id;

    // Delete the transaction
    const result = await deleteTransaction(userId, transactionId);

    expect(result.success).toBe(true);

    // Verify transaction was deleted from database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(transactions).toHaveLength(0);
  });

  it('should not delete a transaction owned by another user', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashedpassword',
        name: 'User 1'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashedpassword',
        name: 'User 2'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create category for user1
    const categoryResult = await db.insert(categoriesTable)
      .values({
        user_id: user1Id,
        name: 'Food',
        type: 'expense'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create transaction for user1
    const transactionResult = await db.insert(transactionsTable)
      .values({
        user_id: user1Id,
        category_id: categoryId,
        amount: '50.00',
        description: 'Lunch',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const transactionId = transactionResult[0].id;

    // Try to delete user1's transaction as user2
    const result = await deleteTransaction(user2Id, transactionId);

    expect(result.success).toBe(false);

    // Verify transaction still exists in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .execute();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].user_id).toBe(user1Id);
  });

  it('should return false for non-existent transaction', async () => {
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

    // Try to delete non-existent transaction
    const result = await deleteTransaction(userId, 99999);

    expect(result.success).toBe(false);
  });

  it('should handle multiple transactions correctly', async () => {
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

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        user_id: userId,
        name: 'Food',
        type: 'expense'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create multiple transactions
    const transaction1Result = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        category_id: categoryId,
        amount: '25.00',
        description: 'Breakfast',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const transaction1Id = transaction1Result[0].id;

    const transaction2Result = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        category_id: categoryId,
        amount: '50.00',
        description: 'Lunch',
        transaction_date: new Date('2024-01-15')
      })
      .returning()
      .execute();
    const transaction2Id = transaction2Result[0].id;

    // Delete only the first transaction
    const result = await deleteTransaction(userId, transaction1Id);

    expect(result.success).toBe(true);

    // Verify only first transaction was deleted
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.user_id, userId))
      .execute();

    expect(remainingTransactions).toHaveLength(1);
    expect(remainingTransactions[0].id).toBe(transaction2Id);
    expect(remainingTransactions[0].description).toBe('Lunch');
  });
});
