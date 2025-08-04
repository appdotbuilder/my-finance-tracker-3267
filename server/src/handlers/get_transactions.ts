
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction, type DateRangeFilter } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getTransactions(userId: number, filter?: DateRangeFilter): Promise<Transaction[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(transactionsTable.user_id, userId)
    ];

    // Add date range filter if provided
    if (filter) {
      const startDate = new Date(filter.start_date);
      const endDate = new Date(filter.end_date);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      
      conditions.push(gte(transactionsTable.transaction_date, startDate));
      conditions.push(lte(transactionsTable.transaction_date, endDate));
    }

    // Execute query with all conditions at once
    const results = await db.select()
      .from(transactionsTable)
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.transaction_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Get transactions failed:', error);
    throw error;
  }
}
