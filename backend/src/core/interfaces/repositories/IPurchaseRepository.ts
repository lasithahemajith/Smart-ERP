import { SupplierEntity, PurchaseOrderEntity, PurchaseOrderItemEntity, PurchaseOrderStatus } from '../../entities/Purchase';

export interface CreatePurchaseOrderItemDto {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  createdById: string;
  expectedDate?: Date;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface CreateSupplierDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface IPurchaseRepository {
  // Suppliers
  findSupplierById(id: string): Promise<SupplierEntity | null>;
  findAllSuppliers(): Promise<SupplierEntity[]>;
  createSupplier(data: CreateSupplierDto): Promise<SupplierEntity>;
  updateSupplier(id: string, data: Partial<CreateSupplierDto>): Promise<SupplierEntity>;
  deleteSupplier(id: string): Promise<void>;

  // Purchase Orders
  findPOById(id: string): Promise<(PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }) | null>;
  findAllPOs(filter?: { status?: PurchaseOrderStatus; supplierId?: string }): Promise<PurchaseOrderEntity[]>;
  createPO(data: CreatePurchaseOrderDto): Promise<PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }>;
  updatePOStatus(id: string, status: PurchaseOrderStatus, approvedById?: string, receivedDate?: Date): Promise<PurchaseOrderEntity>;
  receivePO(id: string, warehouseId: string): Promise<PurchaseOrderEntity>;
}
