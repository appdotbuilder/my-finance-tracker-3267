
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard data for user with no transactions', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    const result = await getDashboardData(userId);

    expect(result.current_month_summary.total_income).toEqual(0);
    expect(result.current_month_summary.total_expense).toEqual(0);
    expect(result.current_month_summary.balance).toEqual(0);
    expect(result.current_month_summary.is_overspent).toBe(false);
    expect(result.recent_transactions).toHaveLength(0);
    expect(result.monthly_comparison).toHaveLength(6);
    expect(result.top_categories).toHaveLength(0);
  });

  it('should calculate current month summary correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { user_id: userId, name: 'Salary', type: 'income' },
        { user_id: userId, name: 'Food', type: 'expense' }
      ])
      .returning()
      .execute();

    const incomeCategory = categories[0];
    const expenseCategory = categories[1];

    // Create transactions for current month
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);

    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory.id,
          amount: '5000000.00', // 5M IDR income
          description: 'Monthly salary',
          transaction_date: currentMonthDate
        },
        {
          user_id: userId,
          category_id: expenseCategory.id,
          amount: '1500000.00', // 1.5M IDR expense
          description: 'Groceries',
          transaction_date: currentMonthDate
        }
      ])
      .execute();

    const result = await getDashboardData(userId);

    expect(result.current_month_summary.total_income).toEqual(5000000);
    expect(result.current_month_summary.total_expense).toEqual(1500000);
    expect(result.current_month_summary.balance).toEqual(3500000);
    expect(result.current_month_summary.is_overspent).toBe(false);
    expect(result.current_month_summary.year).toEqual(now.getFullYear());
    expect(result.current_month_summary.month).toEqual(now.getMonth() + 1);
  });

  it('should detect overspending correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { user_id: userId, name: 'Salary', type: 'income' },
        { user_id: userId, name: 'Food', type: 'expense' }
      ])
      .returning()
      .execute();

    const incomeCategory = categories[0];
    const expenseCategory = categories[1];

    // Create transactions where expense > income
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);

    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: incomeCategory.id,
          amount: '2000000.00', // 2M IDR income
          description: 'Part-time salary',
          transaction_date: currentMonthDate
        },
        {
          user_id: userId,
          category_id: expenseCategory.id,
          amount: '3000000.00', // 3M IDR expense
          description: 'Emergency expense',
          transaction_date: currentMonthDate
        }
      ])
      .execute();

    const result = await getDashboardData(userId);

    expect(result.current_month_summary.total_income).toEqual(2000000);
    expect(result.current_month_summary.total_expense).toEqual(3000000);
    expect(result.current_month_summary.balance).toEqual(-1000000);
    expect(result.current_month_summary.is_overspent).toBe(true);
  });

  it('should return recent transactions with category details', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        user_id: userId,
        name: 'Food',
        type: 'expense'
      })
      .returning()
      .execute();
    const categoryId = categories[0].id;

    // Create test transaction
    const transactions = await db.insert(transactionsTable)
      .values({
        user_id: userId,
        category_id: categoryId,
        amount: '50000.00',
        description: 'Lunch',
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const result = await getDashboardData(userId);

    expect(result.recent_transactions).toHaveLength(1);
    const transaction = result.recent_transactions[0];
    expect(transaction.id).toEqual(transactions[0].id);
    expect(transaction.amount).toEqual(50000);
    expect(transaction.description).toEqual('Lunch');
    expect(transaction.category_name).toEqual('Food');
    expect(transaction.category_type).toEqual('expense');
    expect(transaction.transaction_date).toBeInstanceOf(Date);
  });

  it('should return monthly comparison data', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    const result = await getDashboardData(userId);

    expect(result.monthly_comparison).toHaveLength(6);
    result.monthly_comparison.forEach(monthData => {
      expect(monthData.month).toBeDefined();
      expect(typeof monthData.income).toBe('number');
      expect(typeof monthData.expense).toBe('number');
      expect(monthData.income).toBeGreaterThanOrEqual(0);
      expect(monthData.expense).toBeGreaterThanOrEqual(0);
    });
  });

  it('should return top categories for current month', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        name: 'Test User'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { user_id: userId, name: 'Food', type: 'expense' },
        { user_id: userId, name: 'Transport', type: 'expense' }
      ])
      .returning()
      .execute();

    // Create transactions for current month
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);

    await db.insert(transactionsTable)
      .values([
        {
          user_id: userId,
          category_id: categories[0].id,
          amount: '500000.00',
          description: 'Groceries',
          transaction_date: currentMonthDate
        },
        {
          user_id: userId,
          category_id: categories[1].id,
          amount: '200000.00',
          description: 'Gas',
          transaction_date: currentMonthDate
        }
      ])
      .execute();

    const result = await getDashboardData(userId);

    expect(result.top_categories).toHaveLength(2);
    
    // Should be ordered by amount (Food first, then Transport)
    const foodCategory = result.top_categories[0];
    expect(foodCategory.category_name).toEqual('Food');
    expect(foodCategory.total_amount).toEqual(500000);
    expect(foodCategory.transaction_count).toEqual(1);
    expect(foodCategory.category_type).toEqual('expense');

    const transportCategory = result.top_categories[1];
    expect(transportCategory.category_name).toEqual('Transport');
    expect(transportCategory.total_amount).toEqual(200000);
    expect(transportCategory.transaction_count).toEqual(1);
  });
});
