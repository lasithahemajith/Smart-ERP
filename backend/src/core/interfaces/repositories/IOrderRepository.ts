import { OrderEntity, OrderStatus, OrderItemEntity, CustomerEntity, InvoiceEntity, InvoiceStatus } from '../../entities/Order';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderDto {
  customerId: string;
  createdById: string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface IOrderRepository {
  // Customers
  findCustomerById(id: string): Promise<CustomerEntity | null>;
  findAllCustomers(): Promise<CustomerEntity[]>;
  createCustomer(data: CreateCustomerDto): Promise<CustomerEntity>;
  updateCustomer(id: string, data: Partial<CreateCustomerDto>): Promise<CustomerEntity>;

  // Orders
  findOrderById(id: string): Promise<(OrderEntity & { items: OrderItemEntity[] }) | null>;
  findAllOrders(filter?: { status?: OrderStatus; customerId?: string; createdById?: string }): Promise<OrderEntity[]>;
  createOrder(data: CreateOrderDto): Promise<OrderEntity & { items: OrderItemEntity[] }>;
  updateOrderStatus(id: string, status: OrderStatus, approvedById?: string): Promise<OrderEntity>;
  countOrdersByStatus(): Promise<Record<OrderStatus, number>>;
  getOrdersByMonth(year: number): Promise<Array<{ month: number; count: number; revenue: number }>>;

  // Invoices
  findInvoiceById(id: string): Promise<InvoiceEntity | null>;
  findInvoiceByOrderId(orderId: string): Promise<InvoiceEntity | null>;
  createInvoice(orderId: string, dueDate: Date): Promise<InvoiceEntity>;
  updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<InvoiceEntity>;
  findAllInvoices(status?: InvoiceStatus): Promise<InvoiceEntity[]>;
}
