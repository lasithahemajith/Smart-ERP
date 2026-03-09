import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { PurchaseUseCases } from '../../core/usecases/purchases/PurchaseUseCases';
import { validateRequest } from '../middlewares/validation';

export class PurchaseController {
  constructor(private purchaseUseCases: PurchaseUseCases) {}

  supplierValidators = [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    validateRequest,
  ];

  poValidators = [
    body('supplierId').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitCost').isFloat({ min: 0 }),
    validateRequest,
  ];

  // Suppliers
  getAllSuppliers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const suppliers = await this.purchaseUseCases.getAllSuppliers();
      res.json({ success: true, data: suppliers });
    } catch (err) {
      next(err);
    }
  };

  createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supplier = await this.purchaseUseCases.createSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  };

  updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supplier = await this.purchaseUseCases.updateSupplier(String(req.params.id), req.body);
      res.json({ success: true, data: supplier });
    } catch (err) {
      next(err);
    }
  };

  deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.purchaseUseCases.deleteSupplier(String(req.params.id));
      res.json({ success: true, message: 'Supplier deleted' });
    } catch (err) {
      next(err);
    }
  };

  // Purchase Orders
  getAllPOs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, supplierId } = req.query as { status?: string; supplierId?: string };
      const pos = await this.purchaseUseCases.getAllPOs({ status, supplierId });
      res.json({ success: true, data: pos });
    } catch (err) {
      next(err);
    }
  };

  getPOById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.purchaseUseCases.getPOById(String(req.params.id));
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  };

  createPO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.purchaseUseCases.createPO({
        ...req.body,
        createdById: req.user!.sub,
      });
      res.status(201).json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  };

  approvePO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.purchaseUseCases.approvePO(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  };

  rejectPO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.purchaseUseCases.rejectPO(String(req.params.id));
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  };

  receivePO = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const po = await this.purchaseUseCases.receivePO(String(req.params.id), req.body.warehouseId);
      res.json({ success: true, data: po });
    } catch (err) {
      next(err);
    }
  };
}
