import { PrismaClient, Prisma } from '@prisma/client';
import {
  IOrderRepository,
  CreateOrderDto,
  CreateCustomerDto,
} from '../../core/interfaces/repositories/IOrderRepository';
import {
  OrderEntity,
  OrderStatus,
  OrderItemEntity,
  CustomerEntity,
  InvoiceEntity,
  InvoiceStatus,
} from '../../core/entities/Order';

let orderCounter = 1;
let invoiceCounter = 1;

export class OrderRepository implements IOrderRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── Customers ────────────────────────────────────────────────────────────

  async findCustomerById(id: string): Promise<CustomerEntity | null> {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    return c ? this.toCustomerEntity(c) : null;
  }

  async findAllCustomers(): Promise<CustomerEntity[]> {
    const customers = await this.prisma.customer.findMany({ orderBy: { name: 'asc' } });
    return customers.map(this.toCustomerEntity);
  }

  async createCustomer(data: CreateCustomerDto): Promise<CustomerEntity> {
    const c = await this.prisma.customer.create({ data });
    return this.toCustomerEntity(c);
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<CustomerEntity> {
    const c = await this.prisma.customer.update({ where: { id }, data });
    return this.toCustomerEntity(c);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async findOrderById(id: string): Promise<(OrderEntity & { items: OrderItemEntity[] }) | null> {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!o) return null;
    return { ...this.toOrderEntity(o), items: o.items.map(this.toItemEntity) };
  }

  async findAllOrders(filter?: { status?: OrderStatus; customerId?: string; createdById?: string }): Promise<OrderEntity[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.customerId ? { customerId: filter.customerId } : {}),
        ...(filter?.createdById ? { createdById: filter.createdById } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(this.toOrderEntity);
  }

  async createOrder(data: CreateOrderDto): Promise<OrderEntity & { items: OrderItemEntity[] }> {
    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${String(count + orderCounter++).padStart(6, '0')}`;
    const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        createdById: data.createdById,
        notes: data.notes,
        totalAmount: new Prisma.Decimal(totalAmount),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            total: new Prisma.Decimal(item.quantity * item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });

    return { ...this.toOrderEntity(order), items: order.items.map(this.toItemEntity) };
  }

  async updateOrderStatus(id: string, status: OrderStatus, approvedById?: string): Promise<OrderEntity> {
    const o = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(approvedById ? { approvedById } : {}),
      },
    });
    return this.toOrderEntity(o);
  }

  async countOrdersByStatus(): Promise<Record<OrderStatus, number>> {
    const statuses: OrderStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const result = {} as Record<OrderStatus, number>;
    await Promise.all(
      statuses.map(async (status) => {
        result[status] = await this.prisma.order.count({ where: { status } });
      }),
    );
    return result;
  }

  async getOrdersByMonth(year: number): Promise<Array<{ month: number; count: number; revenue: number }>> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        status: { in: ['DELIVERED', 'SHIPPED'] },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0, revenue: 0 }));
    for (const order of orders) {
      const month = order.createdAt.getMonth();
      monthly[month].count++;
      monthly[month].revenue += order.totalAmount.toNumber();
    }
    return monthly;
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async findInvoiceById(id: string): Promise<InvoiceEntity | null> {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    return inv ? this.toInvoiceEntity(inv) : null;
  }

  async findInvoiceByOrderId(orderId: string): Promise<InvoiceEntity | null> {
    const inv = await this.prisma.invoice.findUnique({ where: { orderId } });
    return inv ? this.toInvoiceEntity(inv) : null;
  }

  async createInvoice(orderId: string, dueDate: Date): Promise<InvoiceEntity> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + invoiceCounter++).padStart(6, '0')}`;
    const inv = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        dueDate,
        totalAmount: order.totalAmount,
        status: 'DRAFT',
      },
    });
    return this.toInvoiceEntity(inv);
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<InvoiceEntity> {
    const inv = await this.prisma.invoice.update({ where: { id }, data: { status } });
    return this.toInvoiceEntity(inv);
  }

  async findAllInvoices(status?: InvoiceStatus): Promise<InvoiceEntity[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map(this.toInvoiceEntity);
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toOrderEntity(o: {
    id: string; orderNumber: string; status: string; notes: string | null;
    totalAmount: Prisma.Decimal; customerId: string; createdById: string;
    approvedById: string | null; createdAt: Date; updatedAt: Date;
  }): OrderEntity {
    return {
      id: o.id, orderNumber: o.orderNumber, status: o.status as OrderStatus,
      notes: o.notes, totalAmount: o.totalAmount.toNumber(), customerId: o.customerId,
      createdById: o.createdById, approvedById: o.approvedById,
      createdAt: o.createdAt, updatedAt: o.updatedAt,
    };
  }

  private toItemEntity(i: {
    id: string; quantity: number; unitPrice: Prisma.Decimal;
    total: Prisma.Decimal; orderId: string; productId: string;
  }): OrderItemEntity {
    return {
      id: i.id, quantity: i.quantity, unitPrice: i.unitPrice.toNumber(),
      total: i.total.toNumber(), orderId: i.orderId, productId: i.productId,
    };
  }

  private toCustomerEntity(c: {
    id: string; name: string; email: string; phone: string | null;
    address: string | null; createdAt: Date; updatedAt: Date;
  }): CustomerEntity {
    return { id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address, createdAt: c.createdAt, updatedAt: c.updatedAt };
  }

  private toInvoiceEntity(inv: {
    id: string; invoiceNumber: string; status: string; dueDate: Date;
    totalAmount: Prisma.Decimal; notes: string | null; orderId: string; createdAt: Date; updatedAt: Date;
  }): InvoiceEntity {
    return {
      id: inv.id, invoiceNumber: inv.invoiceNumber, status: inv.status as InvoiceStatus,
      dueDate: inv.dueDate, totalAmount: inv.totalAmount.toNumber(), notes: inv.notes,
      orderId: inv.orderId, createdAt: inv.createdAt, updatedAt: inv.updatedAt,
    };
  }
}
