import { InventoryUseCases } from '../core/usecases/inventory/InventoryUseCases';
import { IInventoryRepository } from '../core/interfaces/repositories/IInventoryRepository';
import { ProductEntity } from '../core/entities/Inventory';
import { AppError } from '../api/middlewares/errorHandler';

const mockProduct: ProductEntity = {
  id: 'prod-1',
  sku: 'SKU-001',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  costPrice: 50.00,
  lowStockAlert: 10,
  unit: 'pcs',
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockInventoryRepo: jest.Mocked<IInventoryRepository> = {
  findProductById: jest.fn(),
  findProductBySku: jest.fn(),
  findAllProducts: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  findWarehouseById: jest.fn(),
  findAllWarehouses: jest.fn(),
  createWarehouse: jest.fn(),
  updateWarehouse: jest.fn(),
  deleteWarehouse: jest.fn(),
  getStock: jest.fn(),
  getTotalStock: jest.fn(),
  updateStock: jest.fn(),
  adjustStock: jest.fn(),
  getLowStockProducts: jest.fn(),
  findAllCategories: jest.fn(),
  createCategory: jest.fn(),
};

describe('InventoryUseCases', () => {
  let inventoryUseCases: InventoryUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    inventoryUseCases = new InventoryUseCases(mockInventoryRepo);
  });

  describe('getAllProducts', () => {
    it('should return products with total stock', async () => {
      mockInventoryRepo.findAllProducts.mockResolvedValue([mockProduct]);
      mockInventoryRepo.getTotalStock.mockResolvedValue(50);

      const products = await inventoryUseCases.getAllProducts();
      expect(products).toHaveLength(1);
      expect(products[0].totalStock).toBe(50);
    });
  });

  describe('createProduct', () => {
    it('should create a product if SKU is unique', async () => {
      mockInventoryRepo.findProductBySku.mockResolvedValue(null);
      mockInventoryRepo.createProduct.mockResolvedValue(mockProduct);

      const product = await inventoryUseCases.createProduct({
        sku: 'SKU-001',
        name: 'Test Product',
        price: 99.99,
        costPrice: 50,
        categoryId: 'cat-1',
      });

      expect(product.sku).toBe('SKU-001');
    });

    it('should throw 409 if SKU already exists', async () => {
      mockInventoryRepo.findProductBySku.mockResolvedValue(mockProduct);
      await expect(
        inventoryUseCases.createProduct({ sku: 'SKU-001', name: 'Dup', price: 10, costPrice: 5, categoryId: 'cat-1' }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock successfully', async () => {
      mockInventoryRepo.findProductById.mockResolvedValue(mockProduct);
      mockInventoryRepo.findWarehouseById.mockResolvedValue({ id: 'wh-1', name: 'WH1', location: 'Main', createdAt: new Date(), updatedAt: new Date() });
      mockInventoryRepo.getStock.mockResolvedValue({ id: 's1', quantity: 100, productId: 'prod-1', warehouseId: 'wh-1' });
      mockInventoryRepo.adjustStock.mockResolvedValue({ id: 's1', quantity: 90, productId: 'prod-1', warehouseId: 'wh-1' });

      await expect(inventoryUseCases.adjustStock('prod-1', 'wh-1', -10)).resolves.not.toThrow();
    });

    it('should throw 400 if stock goes negative', async () => {
      mockInventoryRepo.findProductById.mockResolvedValue(mockProduct);
      mockInventoryRepo.findWarehouseById.mockResolvedValue({ id: 'wh-1', name: 'WH1', location: 'Main', createdAt: new Date(), updatedAt: new Date() });
      mockInventoryRepo.getStock.mockResolvedValue({ id: 's1', quantity: 5, productId: 'prod-1', warehouseId: 'wh-1' });

      await expect(inventoryUseCases.adjustStock('prod-1', 'wh-1', -10)).rejects.toThrow(AppError);
    });
  });
});
