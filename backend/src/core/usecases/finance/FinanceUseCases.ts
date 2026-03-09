import { IFinanceRepository, CreateExpenseDto } from '../../interfaces/repositories/IFinanceRepository';
import { ExpenseEntity, ExpenseCategory } from '../../entities/Finance';
import { AppError } from '../../../api/middlewares/errorHandler';

export class FinanceUseCases {
  constructor(private financeRepo: IFinanceRepository) {}

  async getAllExpenses(filter?: { category?: ExpenseCategory; from?: Date; to?: Date }): Promise<ExpenseEntity[]> {
    return this.financeRepo.findAllExpenses(filter);
  }

  async getExpenseById(id: string): Promise<ExpenseEntity> {
    const expense = await this.financeRepo.findExpenseById(id);
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async createExpense(data: CreateExpenseDto): Promise<ExpenseEntity> {
    return this.financeRepo.createExpense(data);
  }

  async updateExpense(id: string, data: Partial<CreateExpenseDto>): Promise<ExpenseEntity> {
    const existing = await this.financeRepo.findExpenseById(id);
    if (!existing) throw new AppError('Expense not found', 404);
    return this.financeRepo.updateExpense(id, data);
  }

  async deleteExpense(id: string): Promise<void> {
    const existing = await this.financeRepo.findExpenseById(id);
    if (!existing) throw new AppError('Expense not found', 404);
    await this.financeRepo.deleteExpense(id);
  }

  async getExpenseSummary(from?: Date, to?: Date) {
    const [total, byCategory] = await Promise.all([
      this.financeRepo.getTotalExpenses(from, to),
      this.financeRepo.getExpensesByCategory(from, to),
    ]);
    return { total, byCategory };
  }

  async getMonthlyRevenue(year: number) {
    return this.financeRepo.getMonthlyRevenue(year);
  }

  async getProfitDashboard() {
    return this.financeRepo.getProfitDashboard();
  }

  async getSalesTrends(period: 'week' | 'month' | 'year' = 'month') {
    return this.financeRepo.getSalesTrends(period);
  }

  async getInventoryAnalytics() {
    return this.financeRepo.getInventoryAnalytics();
  }
}
