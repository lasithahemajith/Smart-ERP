import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorize } from '../middlewares/auth';

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/stats', authorize('ADMIN'), controller.getStats);
  router.get('/', authorize('ADMIN', 'MANAGER'), controller.getAll);
  router.get('/:id', authorize('ADMIN', 'MANAGER'), controller.getById);
  router.post('/', ...controller.createValidators, authorize('ADMIN'), controller.create);
  router.put('/:id', ...controller.updateValidators, authorize('ADMIN'), controller.update);
  router.delete('/:id', authorize('ADMIN'), controller.delete);

  return router;
}
