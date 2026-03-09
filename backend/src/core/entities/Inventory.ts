export interface ProductEntity {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice: number;
  lowStockAlert: number;
  unit: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseEntity {
  id: string;
  name: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseStockEntity {
  id: string;
  quantity: number;
  productId: string;
  warehouseId: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
