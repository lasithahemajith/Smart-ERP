import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { authenticate, authorize } from '../middlewares/auth';

export function createInventoryRouter(controller: InventoryController): Router {
  const router = Router();

  router.use(authenticate);

  // Categories
  router.get('/categories', controller.getAllCategories);
  router.post('/categories', authorize('ADMIN', 'MANAGER'), controller.createCategory);

  // Products
  router.get('/products/low-stock', controller.getLowStock);
  router.get('/products', controller.getAllProducts);
  router.get('/products/:id', controller.getProductById);
  router.post('/products', ...controller.productValidators, authorize('ADMIN', 'MANAGER'), controller.createProduct);
  router.put('/products/:id', authorize('ADMIN', 'MANAGER'), controller.updateProduct);
  router.delete('/products/:id', authorize('ADMIN'), controller.deleteProduct);

  // Warehouses
  router.get('/warehouses', controller.getAllWarehouses);
  router.post('/warehouses', ...controller.warehouseValidators, authorize('ADMIN', 'MANAGER'), controller.createWarehouse);
  router.put('/warehouses/:id', authorize('ADMIN', 'MANAGER'), controller.updateWarehouse);
  router.delete('/warehouses/:id', authorize('ADMIN'), controller.deleteWarehouse);

  // Stock adjustment
  router.post('/stock/adjust', authorize('ADMIN', 'MANAGER'), controller.adjustStock);

  return router;
}
