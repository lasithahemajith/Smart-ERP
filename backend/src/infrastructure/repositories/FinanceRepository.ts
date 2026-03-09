import { PrismaClient, Prisma } from '@prisma/client';
import {
  IFinanceRepository,
  CreateExpenseDto,
} from '../../core/interfaces/repositories/IFinanceRepository';
import { ExpenseEntity, ExpenseCategory, ProfitDashboard, RevenueReport } from '../../core/entities/Finance';

export class FinanceRepository implements IFinanceRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── Expenses ─────────────────────────────────────────────────────────────

  async findExpenseById(id: string): Promise<ExpenseEntity | null> {
    const e = await this.prisma.expense.findUnique({ where: { id } });
    return e ? this.toExpenseEntity(e) : null;
  }

  async findAllExpenses(filter?: { category?: ExpenseCategory; from?: Date; to?: Date }): Promise<ExpenseEntity[]> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...(filter?.category ? { category: filter.category } : {}),
        ...(filter?.from || filter?.to
          ? {
              date: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
    return expenses.map(this.toExpenseEntity);
  }

  async createExpense(data: CreateExpenseDto): Promise<ExpenseEntity> {
    const e = await this.prisma.expense.create({
      data: {
        title: data.title,
        amount: new Prisma.Decimal(data.amount),
        category: data.category,
        description: data.description,
        date: data.date ?? new Date(),
        createdById: data.createdById,
      },
    });
    return this.toExpenseEntity(e);
  }

  async updateExpense(id: string, data: Partial<CreateExpenseDto>): Promise<ExpenseEntity> {
    const e = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount) } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.date !== undefined ? { date: data.date } : {}),
      },
    });
    return this.toExpenseEntity(e);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }

  async getTotalExpenses(from?: Date, to?: Date): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : undefined,
      _sum: { amount: true },
    });
    return result._sum.amount?.toNumber() ?? 0;
  }

  async getExpensesByCategory(from?: Date, to?: Date): Promise<Array<{ category: ExpenseCategory; total: number }>> {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : undefined,
      _sum: { amount: true },
    });
    return expenses.map((e) => ({
      category: e.category as ExpenseCategory,
      total: e._sum.amount?.toNumber() ?? 0,
    }));
  }

  // ─── Revenue & Reporting ──────────────────────────────────────────────────

  async getMonthlyRevenue(year: number): Promise<RevenueReport[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        status: { in: ['DELIVERED', 'SHIPPED'] },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      select: { date: true, amount: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: monthNames[i],
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));

    for (const order of orders) {
      monthly[order.createdAt.getMonth()].revenue += order.totalAmount.toNumber();
    }
    for (const expense of expenses) {
      monthly[expense.date.getMonth()].expenses += expense.amount.toNumber();
    }
    for (const m of monthly) {
      m.profit = m.revenue - m.expenses;
    }

    return monthly;
  }

  async getProfitDashboard(): Promise<ProfitDashboard> {
    const year = new Date().getFullYear();
    const monthlyData = await this.getMonthlyRevenue(year);

    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalExpenses, netProfit, profitMargin: Math.round(profitMargin * 100) / 100, monthlyData };
  }

  async getSalesTrends(period: 'week' | 'month' | 'year'): Promise<Array<{ label: string; sales: number; revenue: number }>> {
    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['DELIVERED', 'SHIPPED', 'APPROVED'] },
      },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    if (period === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const result = days.map((d) => ({ label: d, sales: 0, revenue: 0 }));
      for (const order of orders) {
        result[order.createdAt.getDay()].sales++;
        result[order.createdAt.getDay()].revenue += order.totalAmount.toNumber();
      }
      return result;
    }

    if (period === 'month') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const result = weeks.map((w) => ({ label: w, sales: 0, revenue: 0 }));
      for (const order of orders) {
        const weekIdx = Math.min(3, Math.floor((order.createdAt.getDate() - 1) / 7));
        result[weekIdx].sales++;
        result[weekIdx].revenue += order.totalAmount.toNumber();
      }
      return result;
    }

    // year - group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = months.map((m) => ({ label: m, sales: 0, revenue: 0 }));
    for (const order of orders) {
      result[order.createdAt.getMonth()].sales++;
      result[order.createdAt.getMonth()].revenue += order.totalAmount.toNumber();
    }
    return result;
  }

  async getInventoryAnalytics(): Promise<{
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    topSellingProducts: Array<{ productId: string; name: string; sold: number; revenue: number }>;
  }> {
    const [totalProducts, stockData, lowStockData, topSelling] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.warehouseStock.findMany({ include: { product: true } }),
      this.prisma.product.findMany({ include: { stocks: true } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    const totalStockValue = stockData.reduce(
      (sum, s) => sum + s.quantity * s.product.costPrice.toNumber(),
      0,
    );

    const lowStockCount = lowStockData.filter(
      (p) => p.stocks.reduce((s, st) => s + st.quantity, 0) <= p.lowStockAlert,
    ).length;

    const productIds = topSelling.map((t) => t.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const topSellingProducts = topSelling.map((t) => ({
      productId: t.productId,
      name: productMap.get(t.productId) ?? 'Unknown',
      sold: t._sum.quantity ?? 0,
      revenue: t._sum.total?.toNumber() ?? 0,
    }));

    return { totalProducts, totalStockValue, lowStockCount, topSellingProducts };
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toExpenseEntity(e: {
    id: string; title: string; amount: Prisma.Decimal; category: string;
    description: string | null; date: Date; createdById: string; createdAt: Date; updatedAt: Date;
  }): ExpenseEntity {
    return {
      id: e.id, title: e.title, amount: e.amount.toNumber(),
      category: e.category as ExpenseCategory, description: e.description,
      date: e.date, createdById: e.createdById, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  }
}
