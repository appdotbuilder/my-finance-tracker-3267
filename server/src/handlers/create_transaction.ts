
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createTransaction(userId: number, input: CreateTransactionInput): Promise<Transaction> {
  try {
    // First, verify that the category exists and belongs to the user
    const category = await db.select()
      .from(categoriesTable)
      .where(and(
        eq(categoriesTable.id, input.category_id),
        eq(categoriesTable.user_id, userId)
      ))
      .execute();

    if (category.length === 0) {
      throw new Error('Category not found or does not belong to user');
    }

    // Parse the transaction date string into a Date object
    const transactionDate = new Date(input.transaction_date + 'T00:00:00.000Z');
    if (isNaN(transactionDate.getTime())) {
      throw new Error('Invalid transaction date format');
    }

    // Insert the transaction record
    const result = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        category_id: input.category_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description || null,
        transaction_date: transactionDate
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}
