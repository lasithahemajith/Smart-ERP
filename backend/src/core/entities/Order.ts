export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface CustomerEntity {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemEntity {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  orderId: string;
  productId: string;
}

export interface OrderEntity {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  notes?: string | null;
  totalAmount: number;
  customerId: string;
  createdById: string;
  approvedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  dueDate: Date;
  totalAmount: number;
  notes?: string | null;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
}
