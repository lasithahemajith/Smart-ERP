import { PrismaClient, Prisma } from '@prisma/client';
import {
  IPurchaseRepository,
  CreatePurchaseOrderDto,
  CreateSupplierDto,
} from '../../core/interfaces/repositories/IPurchaseRepository';
import {
  SupplierEntity,
  PurchaseOrderEntity,
  PurchaseOrderItemEntity,
  PurchaseOrderStatus,
} from '../../core/entities/Purchase';

export class PurchaseRepository implements IPurchaseRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  async findSupplierById(id: string): Promise<SupplierEntity | null> {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    return s ? this.toSupplierEntity(s) : null;
  }

  async findAllSuppliers(): Promise<SupplierEntity[]> {
    const suppliers = await this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return suppliers.map(this.toSupplierEntity);
  }

  async createSupplier(data: CreateSupplierDto): Promise<SupplierEntity> {
    const s = await this.prisma.supplier.create({ data });
    return this.toSupplierEntity(s);
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierDto>): Promise<SupplierEntity> {
    const s = await this.prisma.supplier.update({ where: { id }, data });
    return this.toSupplierEntity(s);
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.prisma.supplier.delete({ where: { id } });
  }

  // ─── Purchase Orders ──────────────────────────────────────────────────────

  async findPOById(id: string): Promise<(PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }) | null> {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) return null;
    return { ...this.toPOEntity(po), items: po.items.map(this.toItemEntity) };
  }

  async findAllPOs(filter?: { status?: PurchaseOrderStatus; supplierId?: string }): Promise<PurchaseOrderEntity[]> {
    const pos = await this.prisma.purchaseOrder.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.supplierId ? { supplierId: filter.supplierId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return pos.map(this.toPOEntity);
  }

  async createPO(data: CreatePurchaseOrderDto): Promise<PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }> {
    const count = await this.prisma.purchaseOrder.count();
    const timestamp = Date.now().toString(36).toUpperCase();
    const poNumber = `PO-${String(count + 1).padStart(5, '0')}-${timestamp}`;
    const totalAmount = data.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        createdById: data.createdById,
        expectedDate: data.expectedDate,
        notes: data.notes,
        totalAmount: new Prisma.Decimal(totalAmount),
        status: 'DRAFT',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitCost),
            total: new Prisma.Decimal(item.quantity * item.unitCost),
          })),
        },
      },
      include: { items: true },
    });

    return { ...this.toPOEntity(po), items: po.items.map(this.toItemEntity) };
  }

  async updatePOStatus(id: string, status: PurchaseOrderStatus, approvedById?: string, receivedDate?: Date): Promise<PurchaseOrderEntity> {
    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        ...(approvedById ? { approvedById } : {}),
        ...(receivedDate ? { receivedDate } : {}),
      },
    });
    return this.toPOEntity(po);
  }

  async receivePO(id: string, warehouseId: string): Promise<PurchaseOrderEntity> {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    if (!po) throw new Error('Purchase Order not found');

    // Update stock for each item
    for (const item of po.items) {
      await this.prisma.warehouseStock.upsert({
        where: { productId_warehouseId: { productId: item.productId, warehouseId } },
        create: { productId: item.productId, warehouseId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
      });
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: { received: item.quantity },
      });
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedDate: new Date() },
    });
    return this.toPOEntity(updated);
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toPOEntity(po: {
    id: string; poNumber: string; status: string; totalAmount: Prisma.Decimal;
    expectedDate: Date | null; receivedDate: Date | null; notes: string | null;
    supplierId: string; createdById: string; approvedById: string | null;
    createdAt: Date; updatedAt: Date;
  }): PurchaseOrderEntity {
    return {
      id: po.id, poNumber: po.poNumber, status: po.status as PurchaseOrderStatus,
      totalAmount: po.totalAmount.toNumber(), expectedDate: po.expectedDate,
      receivedDate: po.receivedDate, notes: po.notes, supplierId: po.supplierId,
      createdById: po.createdById, approvedById: po.approvedById,
      createdAt: po.createdAt, updatedAt: po.updatedAt,
    };
  }

  private toItemEntity(i: {
    id: string; quantity: number; unitCost: Prisma.Decimal;
    total: Prisma.Decimal; received: number; purchaseOrderId: string; productId: string;
  }): PurchaseOrderItemEntity {
    return {
      id: i.id, quantity: i.quantity, unitCost: i.unitCost.toNumber(),
      total: i.total.toNumber(), received: i.received,
      purchaseOrderId: i.purchaseOrderId, productId: i.productId,
    };
  }

  private toSupplierEntity(s: {
    id: string; name: string; email: string; phone: string | null;
    address: string | null; contactPerson: string | null; createdAt: Date; updatedAt: Date;
  }): SupplierEntity {
    return {
      id: s.id, name: s.name, email: s.email, phone: s.phone,
      address: s.address, contactPerson: s.contactPerson,
      createdAt: s.createdAt, updatedAt: s.updatedAt,
    };
  }
}
