import { Router } from 'express';
import { FinanceController } from '../controllers/FinanceController';
import { authenticate, authorize } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

export function createFinanceRouter(controller: FinanceController): Router {
  const router = Router();

  router.use(apiRateLimiter);
  router.use(authenticate);

  // Expenses
  router.get('/expenses', controller.getAllExpenses);
  router.get('/expenses/summary', controller.getExpenseSummary);
  router.get('/expenses/:id', controller.getExpenseById);
  router.post('/expenses', ...controller.expenseValidators, controller.createExpense);
  router.put('/expenses/:id', authorize('ADMIN', 'MANAGER'), controller.updateExpense);
  router.delete('/expenses/:id', authorize('ADMIN', 'MANAGER'), controller.deleteExpense);

  // Revenue & Analytics
  router.get('/revenue/monthly', authorize('ADMIN', 'MANAGER'), controller.getMonthlyRevenue);
  router.get('/profit-dashboard', authorize('ADMIN', 'MANAGER'), controller.getProfitDashboard);
  router.get('/sales-trends', authorize('ADMIN', 'MANAGER'), controller.getSalesTrends);
  router.get('/inventory-analytics', authorize('ADMIN', 'MANAGER'), controller.getInventoryAnalytics);

  return router;
}
