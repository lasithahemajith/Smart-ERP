import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticate, authorize } from '../middlewares/auth';

export function createOrderRouter(controller: OrderController): Router {
  const router = Router();

  router.use(authenticate);

  // Customers
  router.get('/customers', controller.getAllCustomers);
  router.post('/customers', ...controller.customerValidators, controller.createCustomer);
  router.put('/customers/:id', controller.updateCustomer);

  // Orders
  router.get('/', controller.getAllOrders);
  router.get('/:id', controller.getOrderById);
  router.post('/', ...controller.orderValidators, controller.createOrder);
  router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), controller.approveOrder);
  router.post('/:id/reject', authorize('ADMIN', 'MANAGER'), controller.rejectOrder);
  router.post('/:id/ship', authorize('ADMIN', 'MANAGER'), controller.shipOrder);
  router.post('/:id/deliver', authorize('ADMIN', 'MANAGER'), controller.deliverOrder);
  router.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), controller.cancelOrder);

  // Invoices
  router.get('/invoices/all', controller.getAllInvoices);
  router.post('/invoices/:orderId/generate', authorize('ADMIN', 'MANAGER'), controller.generateInvoice);
  router.put('/invoices/:id/status', authorize('ADMIN', 'MANAGER'), controller.updateInvoiceStatus);

  return router;
}
