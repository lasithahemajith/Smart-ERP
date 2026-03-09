export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface SupplierEntity {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItemEntity {
  id: string;
  quantity: number;
  unitCost: number;
  total: number;
  received: number;
  purchaseOrderId: string;
  productId: string;
}

export interface PurchaseOrderEntity {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  expectedDate?: Date | null;
  receivedDate?: Date | null;
  notes?: string | null;
  supplierId: string;
  createdById: string;
  approvedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
