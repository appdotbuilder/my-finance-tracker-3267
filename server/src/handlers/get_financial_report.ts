
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type DateRangeFilter, type FinancialReport, type CategoryReport, type MonthlySummary } from '../schema';
import { eq, and, gte, lte, sum, count, sql } from 'drizzle-orm';

export async function getFinancialReport(userId: number, filter: DateRangeFilter): Promise<FinancialReport> {
  try {
    const startDate = new Date(filter.start_date);
    const endDate = new Date(filter.end_date);

    // Get category breakdown with totals
    const categoryResults = await db
      .select({
        category_id: categoriesTable.id,
        category_name: categoriesTable.name,
        category_type: categoriesTable.type,
        total_amount: sum(transactionsTable.amount).as('total_amount'),
        transaction_count: count(transactionsTable.id).as('transaction_count')
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.transaction_date, startDate),
          lte(transactionsTable.transaction_date, endDate)
        )
      )
      .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.type)
      .execute();

    // Convert category results with numeric parsing
    const categories: CategoryReport[] = categoryResults.map(result => ({
      category_id: result.category_id,
      category_name: result.category_name,
      category_type: result.category_type,
      total_amount: parseFloat(result.total_amount || '0'),
      transaction_count: result.transaction_count
    }));

    // Get monthly breakdown
    const monthlyResults = await db
      .select({
        year: sql<string>`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`.as('year'),
        month: sql<string>`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`.as('month'),
        type: categoriesTable.type,
        total_amount: sum(transactionsTable.amount).as('total_amount')
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.transaction_date, startDate),
          lte(transactionsTable.transaction_date, endDate)
        )
      )
      .groupBy(
        sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
        sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`,
        categoriesTable.type
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
        sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`
      )
      .execute();

    // Aggregate monthly data by year/month
    const monthlyMap = new Map<string, { year: number; month: number; income: number; expense: number }>();

    monthlyResults.forEach(result => {
      const year = parseInt(result.year);
      const month = parseInt(result.month);
      const key = `${year}-${month}`;
      const existing = monthlyMap.get(key) || {
        year,
        month,
        income: 0,
        expense: 0
      };

      const amount = parseFloat(result.total_amount || '0');
      if (result.type === 'income') {
        existing.income += amount;
      } else {
        existing.expense += amount;
      }

      monthlyMap.set(key, existing);
    });

    // Convert to monthly summaries
    const monthly_breakdown: MonthlySummary[] = Array.from(monthlyMap.values()).map(data => ({
      year: data.year,
      month: data.month,
      total_income: data.income,
      total_expense: data.expense,
      balance: data.income - data.expense,
      is_overspent: data.expense > data.income
    }));

    // Calculate overall summary
    const totalIncome = categories
      .filter(cat => cat.category_type === 'income')
      .reduce((sum, cat) => sum + cat.total_amount, 0);

    const totalExpense = categories
      .filter(cat => cat.category_type === 'expense')
      .reduce((sum, cat) => sum + cat.total_amount, 0);

    return {
      period: {
        start_date: filter.start_date,
        end_date: filter.end_date,
        type: filter.period_type || 'custom'
      },
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense
      },
      categories,
      monthly_breakdown
    };
  } catch (error) {
    console.error('Financial report generation failed:', error);
    throw error;
  }
}
