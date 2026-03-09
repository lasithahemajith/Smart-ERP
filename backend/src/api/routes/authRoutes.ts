import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/auth';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', controller.registerValidators, controller.register);
  router.post('/login', controller.loginValidators, controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);
  router.put('/change-password', authenticate, controller.changePassword);

  return router;
}
