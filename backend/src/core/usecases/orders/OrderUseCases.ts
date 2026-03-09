import { IOrderRepository, CreateOrderDto, CreateCustomerDto } from '../../interfaces/repositories/IOrderRepository';
import { IInventoryRepository } from '../../interfaces/repositories/IInventoryRepository';
import { OrderEntity, OrderStatus, InvoiceStatus, CustomerEntity } from '../../entities/Order';
import { AppError } from '../../../api/middlewares/errorHandler';

export class OrderUseCases {
  constructor(
    private orderRepo: IOrderRepository,
    private inventoryRepo: IInventoryRepository,
  ) {}

  // ─── Customers ────────────────────────────────────────────────────────────

  async getAllCustomers(): Promise<CustomerEntity[]> {
    return this.orderRepo.findAllCustomers();
  }

  async createCustomer(data: CreateCustomerDto): Promise<CustomerEntity> {
    return this.orderRepo.createCustomer(data);
  }

  async updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<CustomerEntity> {
    const existing = await this.orderRepo.findCustomerById(id);
    if (!existing) throw new AppError('Customer not found', 404);
    return this.orderRepo.updateCustomer(id, data);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  async getAllOrders(filter?: { status?: OrderStatus; customerId?: string }): Promise<OrderEntity[]> {
    return this.orderRepo.findAllOrders(filter);
  }

  async getOrderById(id: string) {
    const order = await this.orderRepo.findOrderById(id);
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async createOrder(data: CreateOrderDto) {
    // Validate customer
    const customer = await this.orderRepo.findCustomerById(data.customerId);
    if (!customer) throw new AppError('Customer not found', 404);

    // Validate products
    for (const item of data.items) {
      const product = await this.inventoryRepo.findProductById(item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
    }

    return this.orderRepo.createOrder(data);
  }

  async approveOrder(orderId: string, approverId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'PENDING') throw new AppError('Order is not in PENDING status', 400);
    return this.orderRepo.updateOrderStatus(orderId, 'APPROVED', approverId);
  }

  async rejectOrder(orderId: string, approverId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'PENDING') throw new AppError('Order is not in PENDING status', 400);
    return this.orderRepo.updateOrderStatus(orderId, 'REJECTED', approverId);
  }

  async shipOrder(orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'APPROVED') throw new AppError('Order must be APPROVED before shipping', 400);

    // Deduct stock from first available warehouse
    const warehouses = await this.inventoryRepo.findAllWarehouses();
    if (warehouses.length === 0) throw new AppError('No warehouses configured', 400);
    const warehouseId = warehouses[0].id;

    for (const item of order.items) {
      const stock = await this.inventoryRepo.getStock(item.productId, warehouseId);
      if (!stock || stock.quantity < item.quantity) {
        throw new AppError(`Insufficient stock for product ${item.productId}`, 400);
      }
      await this.inventoryRepo.adjustStock(item.productId, warehouseId, -item.quantity);
    }

    return this.orderRepo.updateOrderStatus(orderId, 'SHIPPED');
  }

  async deliverOrder(orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'SHIPPED') throw new AppError('Order must be SHIPPED before delivery', 400);
    return this.orderRepo.updateOrderStatus(orderId, 'DELIVERED');
  }

  async cancelOrder(orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new AppError('Cannot cancel a delivered or already cancelled order', 400);
    }
    return this.orderRepo.updateOrderStatus(orderId, 'CANCELLED');
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async generateInvoice(orderId: string, dueDaysFromNow = 30) {
    const order = await this.orderRepo.findOrderById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (!['APPROVED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw new AppError('Invoice can only be generated for approved or shipped orders', 400);
    }
    const existing = await this.orderRepo.findInvoiceByOrderId(orderId);
    if (existing) throw new AppError('Invoice already exists for this order', 409);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDaysFromNow);
    return this.orderRepo.createInvoice(orderId, dueDate);
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    const invoice = await this.orderRepo.findInvoiceById(invoiceId);
    if (!invoice) throw new AppError('Invoice not found', 404);
    return this.orderRepo.updateInvoiceStatus(invoiceId, status);
  }

  async getAllInvoices(status?: InvoiceStatus) {
    return this.orderRepo.findAllInvoices(status);
  }
}
