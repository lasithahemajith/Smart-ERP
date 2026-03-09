import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', authRateLimiter, controller.registerValidators, controller.register);
  router.post('/login', authRateLimiter, controller.loginValidators, controller.login);
  router.post('/refresh', authRateLimiter, controller.refresh);
  router.post('/logout', authRateLimiter, authenticate, controller.logout);
  router.get('/me', authRateLimiter, authenticate, controller.me);
  router.put('/change-password', authRateLimiter, authenticate, controller.changePassword);

  return router;
}
