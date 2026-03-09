import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { AuthUseCases } from '../../core/usecases/auth/AuthUseCases';
import { validateRequest } from '../middlewares/validation';

export class AuthController {
  constructor(private authUseCases: AuthUseCases) {}

  registerValidators = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['ADMIN', 'MANAGER', 'EMPLOYEE']),
    validateRequest,
  ];

  loginValidators = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validateRequest,
  ];

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authUseCases.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authUseCases.login(req.body.email, req.body.password);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token required' });
        return;
      }
      const result = await this.authUseCases.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authUseCases.logout(req.user!.sub);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: req.user });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authUseCases.changePassword(req.user!.sub, req.body.currentPassword, req.body.newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  };
}
