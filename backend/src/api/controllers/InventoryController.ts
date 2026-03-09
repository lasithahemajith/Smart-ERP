import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { InventoryUseCases } from '../../core/usecases/inventory/InventoryUseCases';
import { validateRequest } from '../middlewares/validation';

export class InventoryController {
  constructor(private inventoryUseCases: InventoryUseCases) {}

  productValidators = [
    body('sku').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('costPrice').isFloat({ min: 0 }),
    body('categoryId').notEmpty(),
    validateRequest,
  ];

  warehouseValidators = [
    body('name').trim().notEmpty(),
    body('location').trim().notEmpty(),
    validateRequest,
  ];

  // Products
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categoryId } = req.query as { categoryId?: string };
      const products = await this.inventoryUseCases.getAllProducts(categoryId);
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.inventoryUseCases.getProductById(String(req.params.id));
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.inventoryUseCases.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const product = await this.inventoryUseCases.updateProduct(String(req.params.id), req.body);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.inventoryUseCases.deleteProduct(String(req.params.id));
      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  };

  getLowStock = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.inventoryUseCases.getLowStockProducts();
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  };

  // Warehouses
  getAllWarehouses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warehouses = await this.inventoryUseCases.getAllWarehouses();
      res.json({ success: true, data: warehouses });
    } catch (err) {
      next(err);
    }
  };

  createWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warehouse = await this.inventoryUseCases.createWarehouse(req.body);
      res.status(201).json({ success: true, data: warehouse });
    } catch (err) {
      next(err);
    }
  };

  updateWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warehouse = await this.inventoryUseCases.updateWarehouse(String(req.params.id), req.body);
      res.json({ success: true, data: warehouse });
    } catch (err) {
      next(err);
    }
  };

  deleteWarehouse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.inventoryUseCases.deleteWarehouse(String(req.params.id));
      res.json({ success: true, message: 'Warehouse deleted' });
    } catch (err) {
      next(err);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId, warehouseId, delta } = req.body;
      await this.inventoryUseCases.adjustStock(productId, warehouseId, delta);
      res.json({ success: true, message: 'Stock adjusted' });
    } catch (err) {
      next(err);
    }
  };

  // Categories
  getAllCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.inventoryUseCases.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.inventoryUseCases.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  };
}
