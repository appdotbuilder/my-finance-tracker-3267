
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type DateRangeFilter } from '../schema';
import { getFinancialReport } from '../handlers/get_financial_report';

describe('getFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testFilter: DateRangeFilter = {
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    period_type: 'quarterly'
  };

  it('should generate comprehensive financial report', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning()
      .execute();

    // Create test categories
    const [incomeCategory] = await db.insert(categoriesTable)
      .values({
        user_id: user.id,
        name: 'Salary',
        type: 'income',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const [expenseCategory] = await db.insert(categoriesTable)
      .values({
        user_id: user.id,
        name: 'Groceries',
        type: 'expense',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Create test transactions across different months
    await db.insert(transactionsTable)
      .values([
        {
          user_id: user.id,
          category_id: incomeCategory.id,
          amount: '5000000.00', // 5M IDR
          description: 'January salary',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: user.id,
          category_id: expenseCategory.id,
          amount: '1500000.00', // 1.5M IDR
          description: 'January groceries',
          transaction_date: new Date('2024-01-20')
        },
        {
          user_id: user.id,
          category_id: incomeCategory.id,
          amount: '5000000.00', // 5M IDR
          description: 'February salary',
          transaction_date: new Date('2024-02-15')
        },
        {
          user_id: user.id,
          category_id: expenseCategory.id,
          amount: '1200000.00', // 1.2M IDR
          description: 'February groceries',
          transaction_date: new Date('2024-02-20')
        }
      ])
      .execute();

    const result = await getFinancialReport(user.id, testFilter);

    // Verify period information
    expect(result.period.start_date).toEqual('2024-01-01');
    expect(result.period.end_date).toEqual('2024-03-31');
    expect(result.period.type).toEqual('quarterly');

    // Verify overall summary
    expect(result.summary.total_income).toEqual(10000000); // 5M + 5M
    expect(result.summary.total_expense).toEqual(2700000); // 1.5M + 1.2M
    expect(result.summary.balance).toEqual(7300000);

    // Verify category breakdown
    expect(result.categories).toHaveLength(2);
    
    const incomeReport = result.categories.find(cat => cat.category_type === 'income');
    expect(incomeReport).toBeDefined();
    expect(incomeReport!.category_name).toEqual('Salary');
    expect(incomeReport!.total_amount).toEqual(10000000);
    expect(incomeReport!.transaction_count).toEqual(2);

    const expenseReport = result.categories.find(cat => cat.category_type === 'expense');
    expect(expenseReport).toBeDefined();
    expect(expenseReport!.category_name).toEqual('Groceries');
    expect(expenseReport!.total_amount).toEqual(2700000);
    expect(expenseReport!.transaction_count).toEqual(2);

    // Verify monthly breakdown
    expect(result.monthly_breakdown).toHaveLength(2);
    
    const januarySummary = result.monthly_breakdown.find(m => m.month === 1);
    expect(januarySummary).toBeDefined();
    expect(januarySummary!.year).toEqual(2024);
    expect(januarySummary!.total_income).toEqual(5000000);
    expect(januarySummary!.total_expense).toEqual(1500000);
    expect(januarySummary!.balance).toEqual(3500000);
    expect(januarySummary!.is_overspent).toBe(false);

    const februarySummary = result.monthly_breakdown.find(m => m.month === 2);
    expect(februarySummary).toBeDefined();
    expect(februarySummary!.year).toEqual(2024);
    expect(februarySummary!.total_income).toEqual(5000000);
    expect(februarySummary!.total_expense).toEqual(1200000);
    expect(februarySummary!.balance).toEqual(3800000);
    expect(februarySummary!.is_overspent).toBe(false);
  });

  it('should handle empty data correctly', async () => {
    // Create test user with no transactions
    const [user] = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        password_hash: 'hashed_password',
        name: 'Empty User'
      })
      .returning()
      .execute();

    const result = await getFinancialReport(user.id, testFilter);

    expect(result.summary.total_income).toEqual(0);
    expect(result.summary.total_expense).toEqual(0);
    expect(result.summary.balance).toEqual(0);
    expect(result.categories).toHaveLength(0);
    expect(result.monthly_breakdown).toHaveLength(0);
  });

  it('should filter transactions by date range correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'filter@example.com',
        password_hash: 'hashed_password',
        name: 'Filter User'
      })
      .returning()
      .execute();

    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        user_id: user.id,
        name: 'Test Category',
        type: 'income',
        color: '#ffffff'
      })
      .returning()
      .execute();

    // Create transactions - some inside range, some outside
    await db.insert(transactionsTable)
      .values([
        {
          user_id: user.id,
          category_id: category.id,
          amount: '1000000.00',
          description: 'Before range',
          transaction_date: new Date('2023-12-31') // Outside range
        },
        {
          user_id: user.id,
          category_id: category.id,
          amount: '2000000.00',
          description: 'In range',
          transaction_date: new Date('2024-02-15') // Inside range
        },
        {
          user_id: user.id,
          category_id: category.id,
          amount: '3000000.00',
          description: 'After range',
          transaction_date: new Date('2024-04-01') // Outside range
        }
      ])
      .execute();

    const result = await getFinancialReport(user.id, testFilter);

    // Should only include the transaction within date range
    expect(result.summary.total_income).toEqual(2000000);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].total_amount).toEqual(2000000);
    expect(result.categories[0].transaction_count).toEqual(1);
  });

  it('should handle overspent months correctly', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'overspent@example.com',
        password_hash: 'hashed_password',
        name: 'Overspent User'
      })
      .returning()
      .execute();

    // Create categories
    const [incomeCategory] = await db.insert(categoriesTable)
      .values({
        user_id: user.id,
        name: 'Income',
        type: 'income',
        color: '#00ff00'
      })
      .returning()
      .execute();

    const [expenseCategory] = await db.insert(categoriesTable)
      .values({
        user_id: user.id,
        name: 'Expense',
        type: 'expense',
        color: '#ff0000'
      })
      .returning()
      .execute();

    // Create transactions where expense > income
    await db.insert(transactionsTable)
      .values([
        {
          user_id: user.id,
          category_id: incomeCategory.id,
          amount: '2000000.00', // 2M income
          description: 'Low income',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: user.id,
          category_id: expenseCategory.id,
          amount: '3000000.00', // 3M expense
          description: 'High expense',
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await getFinancialReport(user.id, testFilter);

    expect(result.monthly_breakdown).toHaveLength(1);
    const monthlySummary = result.monthly_breakdown[0];
    expect(monthlySummary.total_income).toEqual(2000000);
    expect(monthlySummary.total_expense).toEqual(3000000);
    expect(monthlySummary.balance).toEqual(-1000000); // Negative balance
    expect(monthlySummary.is_overspent).toBe(true);
  });
});
