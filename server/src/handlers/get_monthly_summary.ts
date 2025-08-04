
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type MonthlyFilter, type MonthlySummary } from '../schema';
import { eq, and, gte, lt, sum, sql } from 'drizzle-orm';

export async function getMonthlySummary(userId: number, filter: MonthlyFilter): Promise<MonthlySummary> {
  try {
    // Calculate start and end dates for the month
    const startDate = new Date(filter.year, filter.month - 1, 1); // month - 1 because JS months are 0-indexed
    const endDate = new Date(filter.year, filter.month, 1); // First day of next month

    // Query to get income and expense totals for the month
    const results = await db
      .select({
        category_type: categoriesTable.type,
        total: sum(transactionsTable.amount).as('total')
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.transaction_date, startDate),
          lt(transactionsTable.transaction_date, endDate)
        )
      )
      .groupBy(categoriesTable.type)
      .execute();

    // Initialize totals
    let total_income = 0;
    let total_expense = 0;

    // Process results and convert numeric strings to numbers
    results.forEach(result => {
      const amount = parseFloat(result.total || '0');
      if (result.category_type === 'income') {
        total_income = amount;
      } else if (result.category_type === 'expense') {
        total_expense = amount;
      }
    });

    // Calculate balance and overspent status
    const balance = total_income - total_expense;
    const is_overspent = balance < 0;

    return {
      year: filter.year,
      month: filter.month,
      total_income,
      total_expense,
      balance,
      is_overspent
    };
  } catch (error) {
    console.error('Monthly summary calculation failed:', error);
    throw error;
  }
}
