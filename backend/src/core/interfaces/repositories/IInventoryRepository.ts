import { ProductEntity, WarehouseEntity, WarehouseStockEntity, CategoryEntity } from '../../entities/Inventory';

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  lowStockAlert?: number;
  unit?: string;
  categoryId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  lowStockAlert?: number;
  unit?: string;
  categoryId?: string;
}

export interface CreateWarehouseDto {
  name: string;
  location: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface IInventoryRepository {
  // Products
  findProductById(id: string): Promise<ProductEntity | null>;
  findProductBySku(sku: string): Promise<ProductEntity | null>;
  findAllProducts(categoryId?: string): Promise<ProductEntity[]>;
  createProduct(data: CreateProductDto): Promise<ProductEntity>;
  updateProduct(id: string, data: UpdateProductDto): Promise<ProductEntity>;
  deleteProduct(id: string): Promise<void>;

  // Warehouses
  findWarehouseById(id: string): Promise<WarehouseEntity | null>;
  findAllWarehouses(): Promise<WarehouseEntity[]>;
  createWarehouse(data: CreateWarehouseDto): Promise<WarehouseEntity>;
  updateWarehouse(id: string, data: Partial<CreateWarehouseDto>): Promise<WarehouseEntity>;
  deleteWarehouse(id: string): Promise<void>;

  // Stock
  getStock(productId: string, warehouseId: string): Promise<WarehouseStockEntity | null>;
  getTotalStock(productId: string): Promise<number>;
  updateStock(productId: string, warehouseId: string, quantity: number): Promise<WarehouseStockEntity>;
  adjustStock(productId: string, warehouseId: string, delta: number): Promise<WarehouseStockEntity>;
  getLowStockProducts(): Promise<Array<ProductEntity & { totalStock: number }>>;

  // Categories
  findAllCategories(): Promise<CategoryEntity[]>;
  createCategory(data: CreateCategoryDto): Promise<CategoryEntity>;
}
