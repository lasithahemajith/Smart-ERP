import { Router } from 'express';
import { PurchaseController } from '../controllers/PurchaseController';
import { authenticate, authorize } from '../middlewares/auth';
import { apiRateLimiter } from '../middlewares/rateLimiter';

export function createPurchaseRouter(controller: PurchaseController): Router {
  const router = Router();

  router.use(apiRateLimiter);
  router.use(authenticate);

  // Suppliers
  router.get('/suppliers', controller.getAllSuppliers);
  router.post('/suppliers', ...controller.supplierValidators, authorize('ADMIN', 'MANAGER'), controller.createSupplier);
  router.put('/suppliers/:id', authorize('ADMIN', 'MANAGER'), controller.updateSupplier);
  router.delete('/suppliers/:id', authorize('ADMIN'), controller.deleteSupplier);

  // Purchase Orders
  router.get('/', controller.getAllPOs);
  router.get('/:id', controller.getPOById);
  router.post('/', ...controller.poValidators, authorize('ADMIN', 'MANAGER'), controller.createPO);
  router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), controller.approvePO);
  router.post('/:id/reject', authorize('ADMIN', 'MANAGER'), controller.rejectPO);
  router.post('/:id/receive', authorize('ADMIN', 'MANAGER'), controller.receivePO);

  return router;
}
