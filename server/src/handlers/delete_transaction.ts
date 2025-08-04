
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteTransaction(userId: number, transactionId: number): Promise<{ success: boolean }> {
  try {
    // Delete transaction that belongs to the authenticated user
    const result = await db.delete(transactionsTable)
      .where(and(
        eq(transactionsTable.id, transactionId),
        eq(transactionsTable.user_id, userId)
      ))
      .returning({ id: transactionsTable.id })
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
}
