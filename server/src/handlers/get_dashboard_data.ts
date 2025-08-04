
import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type DashboardData } from '../schema';
import { eq, desc, and, gte, lte, sum, count, sql } from 'drizzle-orm';

export async function getDashboardData(userId: number): Promise<DashboardData> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Calculate current month date range
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Get current month summary
    const currentMonthData = await db
      .select({
        category_type: categoriesTable.type,
        total: sum(transactionsTable.amount)
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.transaction_date, currentMonthStart),
          lte(transactionsTable.transaction_date, currentMonthEnd)
        )
      )
      .groupBy(categoriesTable.type)
      .execute();

    let totalIncome = 0;
    let totalExpense = 0;

    currentMonthData.forEach(row => {
      const amount = parseFloat(row.total || '0');
      if (row.category_type === 'income') {
        totalIncome = amount;
      } else if (row.category_type === 'expense') {
        totalExpense = amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const isOverspent = balance < 0;

    // Get recent transactions (last 10)
    const recentTransactionsData = await db
      .select({
        id: transactionsTable.id,
        user_id: transactionsTable.user_id,
        category_id: transactionsTable.category_id,
        amount: transactionsTable.amount,
        description: transactionsTable.description,
        transaction_date: transactionsTable.transaction_date,
        created_at: transactionsTable.created_at,
        updated_at: transactionsTable.updated_at,
        category_name: categoriesTable.name,
        category_type: categoriesTable.type
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(eq(transactionsTable.user_id, userId))
      .orderBy(desc(transactionsTable.created_at))
      .limit(10)
      .execute();

    const recentTransactions = recentTransactionsData.map(row => ({
      id: row.id,
      user_id: row.user_id,
      category_id: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      transaction_date: row.transaction_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.category_name,
      category_type: row.category_type
    }));

    // Get monthly comparison for last 6 months
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      const monthData = await db
        .select({
          category_type: categoriesTable.type,
          total: sum(transactionsTable.amount)
        })
        .from(transactionsTable)
        .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
        .where(
          and(
            eq(transactionsTable.user_id, userId),
            gte(transactionsTable.transaction_date, monthStart),
            lte(transactionsTable.transaction_date, monthEnd)
          )
        )
        .groupBy(categoriesTable.type)
        .execute();

      let monthIncome = 0;
      let monthExpense = 0;

      monthData.forEach(row => {
        const amount = parseFloat(row.total || '0');
        if (row.category_type === 'income') {
          monthIncome = amount;
        } else if (row.category_type === 'expense') {
          monthExpense = amount;
        }
      });

      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyComparison.push({
        month: monthName,
        income: monthIncome,
        expense: monthExpense
      });
    }

    // Get top categories (by total amount in current month)
    const topCategoriesData = await db
      .select({
        category_id: categoriesTable.id,
        category_name: categoriesTable.name,
        category_type: categoriesTable.type,
        total_amount: sum(transactionsTable.amount),
        transaction_count: count(transactionsTable.id)
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.user_id, userId),
          gte(transactionsTable.transaction_date, currentMonthStart),
          lte(transactionsTable.transaction_date, currentMonthEnd)
        )
      )
      .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.type)
      .orderBy(desc(sum(transactionsTable.amount)))
      .limit(5)
      .execute();

    const topCategories = topCategoriesData.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_type: row.category_type,
      total_amount: parseFloat(row.total_amount || '0'),
      transaction_count: Number(row.transaction_count)
    }));

    return {
      current_month_summary: {
        year: currentYear,
        month: currentMonth,
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: balance,
        is_overspent: isOverspent
      },
      recent_transactions: recentTransactions,
      monthly_comparison: monthlyComparison,
      top_categories: topCategories
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
}
