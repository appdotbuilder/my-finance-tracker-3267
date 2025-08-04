
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  registerInputSchema,
  loginInputSchema,
  changePasswordInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createTransactionInputSchema,
  updateTransactionInputSchema,
  dateRangeFilterSchema,
  monthlyFilterSchema,
  exportFormatSchema
} from './schema';

// Import handlers
import { register } from './handlers/register';
import { login } from './handlers/login';
import { changePassword } from './handlers/change_password';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { updateTransaction } from './handlers/update_transaction';
import { deleteTransaction } from './handlers/delete_transaction';
import { getMonthlySummary } from './handlers/get_monthly_summary';
import { getFinancialReport } from './handlers/get_financial_report';
import { exportReport } from './handlers/export_report';
import { getDashboardData } from './handlers/get_dashboard_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Mock auth context - in real implementation, this would validate JWT tokens
const authenticatedProcedure = publicProcedure.use(({ next }) => {
  // This is a placeholder for authentication middleware
  // In real implementation, extract and validate JWT token
  const userId = 1; // Mock user ID
  return next({
    ctx: { userId }
  });
});

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => register(input)),
  
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  changePassword: authenticatedProcedure
    .input(changePasswordInputSchema)
    .mutation(({ input, ctx }) => changePassword(ctx.userId, input)),

  // Category management routes
  createCategory: authenticatedProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input, ctx }) => createCategory(ctx.userId, input)),
  
  getCategories: authenticatedProcedure
    .query(({ ctx }) => getCategories(ctx.userId)),
  
  updateCategory: authenticatedProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input, ctx }) => updateCategory(ctx.userId, input)),
  
  deleteCategory: authenticatedProcedure
    .input(z.object({ categoryId: z.number() }))
    .mutation(({ input, ctx }) => deleteCategory(ctx.userId, input.categoryId)),

  // Transaction management routes
  createTransaction: authenticatedProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input, ctx }) => createTransaction(ctx.userId, input)),
  
  getTransactions: authenticatedProcedure
    .input(dateRangeFilterSchema.optional())
    .query(({ input, ctx }) => getTransactions(ctx.userId, input)),
  
  updateTransaction: authenticatedProcedure
    .input(updateTransactionInputSchema)
    .mutation(({ input, ctx }) => updateTransaction(ctx.userId, input)),
  
  deleteTransaction: authenticatedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(({ input, ctx }) => deleteTransaction(ctx.userId, input.transactionId)),

  // Financial reporting routes
  getMonthlySummary: authenticatedProcedure
    .input(monthlyFilterSchema)
    .query(({ input, ctx }) => getMonthlySummary(ctx.userId, input)),
  
  getFinancialReport: authenticatedProcedure
    .input(dateRangeFilterSchema)
    .query(({ input, ctx }) => getFinancialReport(ctx.userId, input)),
  
  exportReport: authenticatedProcedure
    .input(dateRangeFilterSchema.extend({ format: exportFormatSchema }))
    .mutation(({ input, ctx }) => exportReport(ctx.userId, input, input.format)),

  // Dashboard route
  getDashboardData: authenticatedProcedure
    .query(({ ctx }) => getDashboardData(ctx.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Personal Finance TRPC server listening at port: ${port}`);
}

start();
