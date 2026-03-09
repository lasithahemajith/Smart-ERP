import { IInventoryRepository, CreateProductDto, UpdateProductDto, CreateWarehouseDto, CreateCategoryDto } from '../../interfaces/repositories/IInventoryRepository';
import { ProductEntity, WarehouseEntity, CategoryEntity } from '../../entities/Inventory';
import { AppError } from '../../../api/middlewares/errorHandler';

export class InventoryUseCases {
  constructor(private inventoryRepo: IInventoryRepository) {}

  // ─── Products ─────────────────────────────────────────────────────────────

  async getAllProducts(categoryId?: string): Promise<Array<ProductEntity & { totalStock: number }>> {
    const products = await this.inventoryRepo.findAllProducts(categoryId);
    const result = await Promise.all(
      products.map(async (p) => ({
        ...p,
        totalStock: await this.inventoryRepo.getTotalStock(p.id),
      })),
    );
    return result;
  }

  async getProductById(id: string): Promise<ProductEntity & { totalStock: number }> {
    const product = await this.inventoryRepo.findProductById(id);
    if (!product) throw new AppError('Product not found', 404);
    const totalStock = await this.inventoryRepo.getTotalStock(id);
    return { ...product, totalStock };
  }

  async createProduct(data: CreateProductDto): Promise<ProductEntity> {
    const existing = await this.inventoryRepo.findProductBySku(data.sku);
    if (existing) throw new AppError('SKU already exists', 409);
    return this.inventoryRepo.createProduct(data);
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<ProductEntity> {
    const existing = await this.inventoryRepo.findProductById(id);
    if (!existing) throw new AppError('Product not found', 404);
    return this.inventoryRepo.updateProduct(id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await this.inventoryRepo.findProductById(id);
    if (!existing) throw new AppError('Product not found', 404);
    await this.inventoryRepo.deleteProduct(id);
  }

  async getLowStockProducts(): Promise<Array<ProductEntity & { totalStock: number }>> {
    return this.inventoryRepo.getLowStockProducts();
  }

  // ─── Warehouses ───────────────────────────────────────────────────────────

  async getAllWarehouses(): Promise<WarehouseEntity[]> {
    return this.inventoryRepo.findAllWarehouses();
  }

  async createWarehouse(data: CreateWarehouseDto): Promise<WarehouseEntity> {
    return this.inventoryRepo.createWarehouse(data);
  }

  async updateWarehouse(id: string, data: Partial<CreateWarehouseDto>): Promise<WarehouseEntity> {
    const existing = await this.inventoryRepo.findWarehouseById(id);
    if (!existing) throw new AppError('Warehouse not found', 404);
    return this.inventoryRepo.updateWarehouse(id, data);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const existing = await this.inventoryRepo.findWarehouseById(id);
    if (!existing) throw new AppError('Warehouse not found', 404);
    await this.inventoryRepo.deleteWarehouse(id);
  }

  async adjustStock(productId: string, warehouseId: string, delta: number): Promise<void> {
    const product = await this.inventoryRepo.findProductById(productId);
    if (!product) throw new AppError('Product not found', 404);
    const warehouse = await this.inventoryRepo.findWarehouseById(warehouseId);
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    const stock = await this.inventoryRepo.getStock(productId, warehouseId);
    const currentQty = stock?.quantity ?? 0;
    if (currentQty + delta < 0) throw new AppError('Insufficient stock', 400);
    await this.inventoryRepo.adjustStock(productId, warehouseId, delta);
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async getAllCategories(): Promise<CategoryEntity[]> {
    return this.inventoryRepo.findAllCategories();
  }

  async createCategory(data: CreateCategoryDto): Promise<CategoryEntity> {
    return this.inventoryRepo.createCategory(data);
  }
}
