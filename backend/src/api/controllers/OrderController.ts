import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { OrderUseCases } from '../../core/usecases/orders/OrderUseCases';
import { validateRequest } from '../middlewares/validation';

export class OrderController {
  constructor(private orderUseCases: OrderUseCases) {}

  orderValidators = [
    body('customerId').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    validateRequest,
  ];

  customerValidators = [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    validateRequest,
  ];

  // Customers
  getAllCustomers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customers = await this.orderUseCases.getAllCustomers();
      res.json({ success: true, data: customers });
    } catch (err) {
      next(err);
    }
  };

  createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await this.orderUseCases.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customer = await this.orderUseCases.updateCustomer(String(req.params.id), req.body);
      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  // Orders
  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, customerId } = req.query as { status?: string; customerId?: string };
      const orders = await this.orderUseCases.getAllOrders({ status: status as 'PENDING' | 'APPROVED' | undefined, customerId });
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.getOrderById(String(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.createOrder({
        ...req.body,
        createdById: req.user!.sub,
      });
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  approveOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.approveOrder(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  rejectOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.rejectOrder(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  shipOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.shipOrder(String(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  deliverOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.deliverOrder(String(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await this.orderUseCases.cancelOrder(String(req.params.id));
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  };

  // Invoices
  generateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.orderUseCases.generateInvoice(String(req.params.orderId), req.body.dueDaysFromNow);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  };

  getAllInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query as { status?: string };
      const invoices = await this.orderUseCases.getAllInvoices(status as 'DRAFT' | 'SENT' | 'PAID' | undefined);
      res.json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  };

  updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await this.orderUseCases.updateInvoiceStatus(String(req.params.id), req.body.status);
      res.json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  };
}
