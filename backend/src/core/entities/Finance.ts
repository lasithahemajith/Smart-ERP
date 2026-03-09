export type ExpenseCategory = 'SALARIES' | 'RENT' | 'UTILITIES' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'TRAVEL' | 'OTHER';

export interface ExpenseEntity {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string | null;
  date: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueReport {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProfitDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyData: RevenueReport[];
}
