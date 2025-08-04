
import { z } from 'zod';

// User authentication schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const changePasswordInputSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(6)
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  type: z.enum(['income', 'expense']),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  color: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Transaction schemas
export const transactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  category_id: z.number(),
  amount: z.number(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive(),
  description: z.string().nullable().optional(),
  transaction_date: z.string() // Date string in YYYY-MM-DD format
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  category_id: z.number().optional(),
  amount: z.number().positive().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.string().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Report and filter schemas
export const dateRangeFilterSchema = z.object({
  start_date: z.string(), // YYYY-MM-DD format
  end_date: z.string(), // YYYY-MM-DD format
  period_type: z.enum(['custom', 'monthly', 'quarterly', 'yearly']).optional()
});

export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;

export const monthlyFilterSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12)
});

export type MonthlyFilter = z.infer<typeof monthlyFilterSchema>;

export const exportFormatSchema = z.enum(['pdf', 'excel']);

export type ExportFormat = z.infer<typeof exportFormatSchema>;

// Response schemas for financial summaries
export const monthlySummarySchema = z.object({
  year: z.number(),
  month: z.number(),
  total_income: z.number(),
  total_expense: z.number(),
  balance: z.number(),
  is_overspent: z.boolean()
});

export type MonthlySummary = z.infer<typeof monthlySummarySchema>;

export const categoryReportSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  category_type: z.enum(['income', 'expense']),
  total_amount: z.number(),
  transaction_count: z.number()
});

export type CategoryReport = z.infer<typeof categoryReportSchema>;

export const financialReportSchema = z.object({
  period: z.object({
    start_date: z.string(),
    end_date: z.string(),
    type: z.string()
  }),
  summary: z.object({
    total_income: z.number(),
    total_expense: z.number(),
    balance: z.number()
  }),
  categories: z.array(categoryReportSchema),
  monthly_breakdown: z.array(monthlySummarySchema)
});

export type FinancialReport = z.infer<typeof financialReportSchema>;

export const dashboardDataSchema = z.object({
  current_month_summary: monthlySummarySchema,
  recent_transactions: z.array(transactionSchema.extend({
    category_name: z.string(),
    category_type: z.enum(['income', 'expense'])
  })),
  monthly_comparison: z.array(z.object({
    month: z.string(),
    income: z.number(),
    expense: z.number()
  })),
  top_categories: z.array(categoryReportSchema)
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
