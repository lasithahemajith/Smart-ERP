import { ExpenseEntity, ExpenseCategory, ProfitDashboard, RevenueReport } from '../../entities/Finance';

export interface CreateExpenseDto {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date?: Date;
  createdById: string;
}

export interface IFinanceRepository {
  // Expenses
  findExpenseById(id: string): Promise<ExpenseEntity | null>;
  findAllExpenses(filter?: { category?: ExpenseCategory; from?: Date; to?: Date }): Promise<ExpenseEntity[]>;
  createExpense(data: CreateExpenseDto): Promise<ExpenseEntity>;
  updateExpense(id: string, data: Partial<CreateExpenseDto>): Promise<ExpenseEntity>;
  deleteExpense(id: string): Promise<void>;
  getTotalExpenses(from?: Date, to?: Date): Promise<number>;
  getExpensesByCategory(from?: Date, to?: Date): Promise<Array<{ category: ExpenseCategory; total: number }>>;

  // Revenue & Reporting
  getMonthlyRevenue(year: number): Promise<RevenueReport[]>;
  getProfitDashboard(): Promise<ProfitDashboard>;
  getSalesTrends(period: 'week' | 'month' | 'year'): Promise<Array<{ label: string; sales: number; revenue: number }>>;
  getInventoryAnalytics(): Promise<{
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    topSellingProducts: Array<{ productId: string; name: string; sold: number; revenue: number }>;
  }>;
}
