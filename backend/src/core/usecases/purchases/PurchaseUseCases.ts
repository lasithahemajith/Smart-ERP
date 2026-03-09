import { IPurchaseRepository, CreatePurchaseOrderDto, CreateSupplierDto } from '../../interfaces/repositories/IPurchaseRepository';
import { IInventoryRepository } from '../../interfaces/repositories/IInventoryRepository';
import { PurchaseOrderEntity, SupplierEntity } from '../../entities/Purchase';
import { AppError } from '../../../api/middlewares/errorHandler';

export class PurchaseUseCases {
  constructor(
    private purchaseRepo: IPurchaseRepository,
    private inventoryRepo: IInventoryRepository,
  ) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  async getAllSuppliers(): Promise<SupplierEntity[]> {
    return this.purchaseRepo.findAllSuppliers();
  }

  async createSupplier(data: CreateSupplierDto): Promise<SupplierEntity> {
    return this.purchaseRepo.createSupplier(data);
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierDto>): Promise<SupplierEntity> {
    const existing = await this.purchaseRepo.findSupplierById(id);
    if (!existing) throw new AppError('Supplier not found', 404);
    return this.purchaseRepo.updateSupplier(id, data);
  }

  async deleteSupplier(id: string): Promise<void> {
    const existing = await this.purchaseRepo.findSupplierById(id);
    if (!existing) throw new AppError('Supplier not found', 404);
    await this.purchaseRepo.deleteSupplier(id);
  }

  // ─── Purchase Orders ──────────────────────────────────────────────────────

  async getAllPOs(filter?: { status?: string; supplierId?: string }) {
    return this.purchaseRepo.findAllPOs(filter as Parameters<IPurchaseRepository['findAllPOs']>[0]);
  }

  async getPOById(id: string) {
    const po = await this.purchaseRepo.findPOById(id);
    if (!po) throw new AppError('Purchase Order not found', 404);
    return po;
  }

  async createPO(data: CreatePurchaseOrderDto) {
    const supplier = await this.purchaseRepo.findSupplierById(data.supplierId);
    if (!supplier) throw new AppError('Supplier not found', 404);

    for (const item of data.items) {
      const product = await this.inventoryRepo.findProductById(item.productId);
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
    }

    return this.purchaseRepo.createPO(data);
  }

  async approvePO(poId: string, approverId: string): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseRepo.findPOById(poId);
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status !== 'PENDING') throw new AppError('PO is not in PENDING status', 400);
    return this.purchaseRepo.updatePOStatus(poId, 'APPROVED', approverId);
  }

  async rejectPO(poId: string): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseRepo.findPOById(poId);
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status !== 'PENDING') throw new AppError('PO is not in PENDING status', 400);
    return this.purchaseRepo.updatePOStatus(poId, 'CANCELLED');
  }

  async receivePO(poId: string, warehouseId: string): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseRepo.findPOById(poId);
    if (!po) throw new AppError('Purchase Order not found', 404);
    if (po.status !== 'APPROVED') throw new AppError('PO must be APPROVED before receiving', 400);

    const warehouse = await this.inventoryRepo.findWarehouseById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    return this.purchaseRepo.receivePO(poId, warehouseId);
  }
}
