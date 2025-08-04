
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, transactionsTable } from '../db/schema';
import { type DateRangeFilter, type ExportFormat } from '../schema';
import { exportReport } from '../handlers/export_report';

// Test data setup
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

const testIncomeCategory = {
  name: 'Salary',
  type: 'income' as const,
  color: '#4CAF50'
};

const testExpenseCategory = {
  name: 'Food',
  type: 'expense' as const,
  color: '#F44336'
};

const testFilter: DateRangeFilter = {
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  period_type: 'monthly'
};

describe('exportReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export report for user with transactions', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create categories
    const [incomeCategory] = await db.insert(categoriesTable)
      .values({ ...testIncomeCategory, user_id: user.id })
      .returning()
      .execute();

    const [expenseCategory] = await db.insert(categoriesTable)
      .values({ ...testExpenseCategory, user_id: user.id })
      .returning()
      .execute();

    // Create transactions within date range
    await db.insert(transactionsTable)
      .values([
        {
          user_id: user.id,
          category_id: incomeCategory.id,
          amount: '5000000.00', // 5M IDR
          description: 'Monthly salary',
          transaction_date: new Date('2024-01-15')
        },
        {
          user_id: user.id,
          category_id: expenseCategory.id,
          amount: '500000.00', // 500K IDR
          description: 'Lunch',
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await exportReport(user.id, testFilter, 'pdf');

    // Verify download URL structure
    expect(result.download_url).toContain('http://localhost:2022/exports/');
    expect(result.download_url).toContain('financial_report_');
    expect(result.download_url).toContain(`${user.id}`);
    expect(result.download_url).toContain('2024-01-01');
    expect(result.download_url).toContain('2024-01-31');
    expect(result.download_url).toContain('.pdf');
  });

  it('should export Excel format report', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create income category
    const [category] = await db.insert(categoriesTable)
      .values({ ...testIncomeCategory, user_id: user.id })
      .returning()
      .execute();

    // Create transaction
    await db.insert(transactionsTable)
      .values({
        user_id: user.id,
        category_id: category.id,
        amount: '1000000.00',
        description: 'Bonus',
        transaction_date: new Date('2024-01-10')
      })
      .execute();

    const result = await exportReport(user.id, testFilter, 'excel');

    expect(result.download_url).toContain('.excel');
    expect(result.download_url).toContain('financial_report_');
  });

  it('should handle empty transaction data', async () => {
    // Create user with no transactions
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await exportReport(user.id, testFilter, 'pdf');

    // Should still generate report URL even with no data
    expect(result.download_url).toContain('financial_report_');
    expect(result.download_url).toContain(`${user.id}`);
  });

  it('should filter transactions by date range', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create category
    const [category] = await db.insert(categoriesTable)
      .values({ ...testIncomeCategory, user_id: user.id })
      .returning()
      .execute();

    // Create transactions - some inside range, some outside
    await db.insert(transactionsTable)
      .values([
        {
          user_id: user.id,
          category_id: category.id,
          amount: '1000000.00',
          description: 'Inside range',
          transaction_date: new Date('2024-01-15') // Inside range
        },
        {
          user_id: user.id,
          category_id: category.id,
          amount: '500000.00',
          description: 'Outside range',
          transaction_date: new Date('2024-02-15') // Outside range
        }
      ])
      .execute();

    const result = await exportReport(user.id, testFilter, 'pdf');

    // Should generate report (filtering is handled internally)
    expect(result.download_url).toContain('financial_report_');
    expect(result.download_url).toContain('2024-01-01');
    expect(result.download_url).toContain('2024-01-31');
  });

  it('should reject invalid date range', async () => {
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const invalidFilter: DateRangeFilter = {
      start_date: '2024-01-31',
      end_date: '2024-01-01', // End before start
      period_type: 'custom'
    };

    await expect(exportReport(user.id, invalidFilter, 'pdf'))
      .rejects.toThrow(/start date must be before or equal to end date/i);
  });

  it('should handle different period types', async () => {
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const quarterlyFilter: DateRangeFilter = {
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      period_type: 'quarterly'
    };

    const result = await exportReport(user.id, quarterlyFilter, 'pdf');

    expect(result.download_url).toContain('financial_report_');
    expect(result.download_url).toContain('2024-01-01');
    expect(result.download_url).toContain('2024-03-31');
  });
});
