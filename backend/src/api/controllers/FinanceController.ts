import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { FinanceUseCases } from '../../core/usecases/finance/FinanceUseCases';
import { validateRequest } from '../middlewares/validation';

export class FinanceController {
  constructor(private financeUseCases: FinanceUseCases) {}

  expenseValidators = [
    body('title').trim().notEmpty(),
    body('amount').isFloat({ min: 0 }),
    body('category').isIn(['SALARIES', 'RENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'MAINTENANCE', 'TRAVEL', 'OTHER']),
    validateRequest,
  ];

  // Expenses
  getAllExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, from, to } = req.query as { category?: string; from?: string; to?: string };
      const expenses = await this.financeUseCases.getAllExpenses({
        category: category as 'SALARIES' | undefined,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
      res.json({ success: true, data: expenses });
    } catch (err) {
      next(err);
    }
  };

  getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.financeUseCases.getExpenseById(String(req.params.id));
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.financeUseCases.createExpense({
        ...req.body,
        createdById: req.user!.sub,
      });
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expense = await this.financeUseCases.updateExpense(String(req.params.id), req.body);
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.financeUseCases.deleteExpense(String(req.params.id));
      res.json({ success: true, message: 'Expense deleted' });
    } catch (err) {
      next(err);
    }
  };

  getExpenseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const summary = await this.financeUseCases.getExpenseSummary(
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  };

  // Revenue & Reporting
  getMonthlyRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await this.financeUseCases.getMonthlyRevenue(year);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getProfitDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.financeUseCases.getProfitDashboard();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getSalesTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
      const data = await this.financeUseCases.getSalesTrends(period);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getInventoryAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.financeUseCases.getInventoryAnalytics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
