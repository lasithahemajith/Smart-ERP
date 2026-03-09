import { PrismaClient, Prisma } from '@prisma/client';
import {
  IInventoryRepository,
  CreateProductDto,
  UpdateProductDto,
  CreateWarehouseDto,
  CreateCategoryDto,
} from '../../core/interfaces/repositories/IInventoryRepository';
import { ProductEntity, WarehouseEntity, WarehouseStockEntity, CategoryEntity } from '../../core/entities/Inventory';

export class InventoryRepository implements IInventoryRepository {
  constructor(private prisma: PrismaClient) {}

  // ─── Products ─────────────────────────────────────────────────────────────

  async findProductById(id: string): Promise<ProductEntity | null> {
    const p = await this.prisma.product.findUnique({ where: { id } });
    return p ? this.toProductEntity(p) : null;
  }

  async findProductBySku(sku: string): Promise<ProductEntity | null> {
    const p = await this.prisma.product.findUnique({ where: { sku } });
    return p ? this.toProductEntity(p) : null;
  }

  async findAllProducts(categoryId?: string): Promise<ProductEntity[]> {
    const products = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: 'asc' },
    });
    return products.map(this.toProductEntity);
  }

  async createProduct(data: CreateProductDto): Promise<ProductEntity> {
    const p = await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        costPrice: new Prisma.Decimal(data.costPrice),
        lowStockAlert: data.lowStockAlert ?? 10,
        unit: data.unit ?? 'pcs',
        categoryId: data.categoryId,
      },
    });
    return this.toProductEntity(p);
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<ProductEntity> {
    const p = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
        ...(data.costPrice !== undefined ? { costPrice: new Prisma.Decimal(data.costPrice) } : {}),
        ...(data.lowStockAlert !== undefined ? { lowStockAlert: data.lowStockAlert } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      },
    });
    return this.toProductEntity(p);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  async getTotalStock(productId: string): Promise<number> {
    const result = await this.prisma.warehouseStock.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  async getLowStockProducts(): Promise<Array<ProductEntity & { totalStock: number }>> {
    const products = await this.prisma.product.findMany({
      include: { stocks: true },
    });
    return products
      .map((p) => {
        const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
        return { ...this.toProductEntity(p), totalStock };
      })
      .filter((p) => p.totalStock <= p.lowStockAlert);
  }

  // ─── Warehouses ───────────────────────────────────────────────────────────

  async findWarehouseById(id: string): Promise<WarehouseEntity | null> {
    const w = await this.prisma.warehouse.findUnique({ where: { id } });
    return w ? this.toWarehouseEntity(w) : null;
  }

  async findAllWarehouses(): Promise<WarehouseEntity[]> {
    const whs = await this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
    return whs.map(this.toWarehouseEntity);
  }

  async createWarehouse(data: CreateWarehouseDto): Promise<WarehouseEntity> {
    const w = await this.prisma.warehouse.create({ data });
    return this.toWarehouseEntity(w);
  }

  async updateWarehouse(id: string, data: Partial<CreateWarehouseDto>): Promise<WarehouseEntity> {
    const w = await this.prisma.warehouse.update({ where: { id }, data });
    return this.toWarehouseEntity(w);
  }

  async deleteWarehouse(id: string): Promise<void> {
    await this.prisma.warehouse.delete({ where: { id } });
  }

  // ─── Stock ────────────────────────────────────────────────────────────────

  async getStock(productId: string, warehouseId: string): Promise<WarehouseStockEntity | null> {
    const s = await this.prisma.warehouseStock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    return s ? this.toStockEntity(s) : null;
  }

  async updateStock(productId: string, warehouseId: string, quantity: number): Promise<WarehouseStockEntity> {
    const s = await this.prisma.warehouseStock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity },
      update: { quantity },
    });
    return this.toStockEntity(s);
  }

  async adjustStock(productId: string, warehouseId: string, delta: number): Promise<WarehouseStockEntity> {
    const current = await this.getStock(productId, warehouseId);
    const newQty = (current?.quantity ?? 0) + delta;
    return this.updateStock(productId, warehouseId, newQty);
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async findAllCategories(): Promise<CategoryEntity[]> {
    const cats = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return cats.map(this.toCategoryEntity);
  }

  async createCategory(data: CreateCategoryDto): Promise<CategoryEntity> {
    const cat = await this.prisma.category.create({ data });
    return this.toCategoryEntity(cat);
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private toProductEntity(p: { id: string; sku: string; name: string; description: string | null; price: Prisma.Decimal; costPrice: Prisma.Decimal; lowStockAlert: number; unit: string; categoryId: string; createdAt: Date; updatedAt: Date }): ProductEntity {
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      price: p.price.toNumber(),
      costPrice: p.costPrice.toNumber(),
      lowStockAlert: p.lowStockAlert,
      unit: p.unit,
      categoryId: p.categoryId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private toWarehouseEntity(w: { id: string; name: string; location: string; createdAt: Date; updatedAt: Date }): WarehouseEntity {
    return { id: w.id, name: w.name, location: w.location, createdAt: w.createdAt, updatedAt: w.updatedAt };
  }

  private toStockEntity(s: { id: string; quantity: number; productId: string; warehouseId: string }): WarehouseStockEntity {
    return { id: s.id, quantity: s.quantity, productId: s.productId, warehouseId: s.warehouseId };
  }

  private toCategoryEntity(c: { id: string; name: string; createdAt: Date; updatedAt: Date }): CategoryEntity {
    return { id: c.id, name: c.name, createdAt: c.createdAt, updatedAt: c.updatedAt };
  }
}
