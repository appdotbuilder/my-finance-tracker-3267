
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type MonthlyFilter } from '../schema';
import { getMonthlySummary } from '../handlers/get_monthly_summary';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

const testFilter: MonthlyFilter = {
  year: 2024,
  month: 1
};

describe('getMonthlySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let incomeCategory: number;
  let expenseCategory: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test categories
    const categoryResults = await db.insert(categoriesTable)
      .values([
        { user_id: userId, name: 'Salary', type: 'income', color: null },
        { user_id: userId, name: 'Food', type: 'expense', color: null }
      ])
      .returning()
      .execute();

    incomeCategory = categoryResults.find(c => c.type === 'income')!.id;
    expenseCategory = categoryResults.find(c => c.type === 'expense')!.id;
  });

  it('should return zero totals for month with no transactions', async () => {
    const result = await getMonthlySummary(userId, testFilter);

    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(1);
    expect(result.total_income).toEqual(0);
    expect(result.total_expense).toEqual(0);
    expect(result.balance).toEqual(0);
    expect(result.is_overspent).toEqual(false);
  });

  it('should calculate summary for month with income and expenses', async () => {
    // Create test transactions for January 2024
    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '5000000.00', // 5 million IDR income
          description: 'Salary',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: userId,
          category_id: expenseCategory,
          amount: '2000000.00', // 2 million IDR expense
          description: 'Groceries',
          transaction_date: new Date('2024-01-20')
        },
        {
          user_id: userId,
          category_id: expenseCategory,
          amount: '1500000.00', // 1.5 million IDR expense
          description: 'Restaurant',
          transaction_date: new Date('2024-01-25')
        }
      ])
      .execute();

    const result = await getMonthlySummary(userId, testFilter);

    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(1);
    expect(result.total_income).toEqual(5000000);
    expect(result.total_expense).toEqual(3500000);
    expect(result.balance).toEqual(1500000);
    expect(result.is_overspent).toEqual(false);
  });

  it('should detect overspent status when expenses exceed income', async () => {
    // Create transactions where expenses exceed income
    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '2000000.00', // 2 million IDR income
          description: 'Part-time salary',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: userId,
          category_id: expenseCategory,
          amount: '3000000.00', // 3 million IDR expense
          description: 'Emergency expense',
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await getMonthlySummary(userId, testFilter);

    expect(result.total_income).toEqual(2000000);
    expect(result.total_expense).toEqual(3000000);
    expect(result.balance).toEqual(-1000000);
    expect(result.is_overspent).toEqual(true);
  });

  it('should only include transactions from the specified month', async () => {
    // Create transactions in different months
    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '3000000.00',
          description: 'January income',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: userId,
          category_id: expenseCategory,
          amount: '1000000.00',
          description: 'January expense',
          transaction_date: new Date('2024-01-20')
        },
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '4000000.00',
          description: 'February income',
          transaction_date: new Date('2024-02-15')
        },
        {
          user_id: userId,
          category_id: expenseCategory,
          amount: '2000000.00',
          description: 'December expense',
          transaction_date: new Date('2023-12-20')
        }
      ])
      .execute();

    const result = await getMonthlySummary(userId, testFilter);

    // Should only include January transactions
    expect(result.total_income).toEqual(3000000);
    expect(result.total_expense).toEqual(1000000);
    expect(result.balance).toEqual(2000000);
    expect(result.is_overspent).toEqual(false);
  });

  it('should handle different months and years correctly', async () => {
    // Create transaction in February 2024
    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '6000000.00',
          description: 'February salary',
          transaction_date: new Date('2024-02-10')
        }
      ])
      .execute();

    // Query for February 2024
    const februaryFilter: MonthlyFilter = { year: 2024, month: 2 };
    const result = await getMonthlySummary(userId, februaryFilter);

    expect(result.year).toEqual(2024);
    expect(result.month).toEqual(2);
    expect(result.total_income).toEqual(6000000);
    expect(result.total_expense).toEqual(0);
    expect(result.balance).toEqual(6000000);
  });

  it('should only include transactions for the specified user', async () => {
    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'another@example.com',
        password_hash: 'hashed_password',
        name: 'Another User'
      })
      .returning()
      .execute();
    const anotherUserId = anotherUserResult[0].id;

    // Create category for another user
    const anotherCategoryResult = await db.insert(categoriesTable)
      .values({
        user_id: anotherUserId,
        name: 'Other Income',
        type: 'income',
        color: null
      })
      .returning()
      .execute();
    const anotherCategoryId = anotherCategoryResult[0].id;

    // Create transactions for both users
    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory,
          amount: '2000000.00',
          description: 'My income',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: anotherUserId,
          category_id: anotherCategoryId,
          amount: '10000000.00',
          description: 'Other user income',
          transaction_date: new Date('2024-01-15')
        }
      ])
      .execute();

    const result = await getMonthlySummary(userId, testFilter);

    // Should only include the first user's transactions
    expect(result.total_income).toEqual(2000000);
    expect(result.total_expense).toEqual(0);
  });
});
