import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { UserUseCases } from '../../core/usecases/users/UserUseCases';
import { validateRequest } from '../middlewares/validation';

export class UserController {
  constructor(private userUseCases: UserUseCases) {}

  createValidators = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'EMPLOYEE']),
    validateRequest,
  ];

  updateValidators = [
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'EMPLOYEE']),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    validateRequest,
  ];

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role, status } = req.query as { role?: string; status?: string };
      const users = await this.userUseCases.getAllUsers({
        role: role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | undefined,
        status: status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | undefined,
      });
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userUseCases.getUserById(String(req.params.id));
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userUseCases.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userUseCases.updateUser(String(req.params.id), req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.userUseCases.deleteUser(String(req.params.id));
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      next(err);
    }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userUseCases.getUserStats();
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  };
}
