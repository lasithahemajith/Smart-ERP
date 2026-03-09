import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config';
import { logger } from './config/logger';
import { errorHandler } from './api/middlewares/errorHandler';
import prisma from './infrastructure/database/prismaClient';

// Repositories
import { UserRepository } from './infrastructure/repositories/UserRepository';
import { InventoryRepository } from './infrastructure/repositories/InventoryRepository';
import { OrderRepository } from './infrastructure/repositories/OrderRepository';
import { PurchaseRepository } from './infrastructure/repositories/PurchaseRepository';
import { FinanceRepository } from './infrastructure/repositories/FinanceRepository';

// Use Cases
import { AuthUseCases } from './core/usecases/auth/AuthUseCases';
import { UserUseCases } from './core/usecases/users/UserUseCases';
import { InventoryUseCases } from './core/usecases/inventory/InventoryUseCases';
import { OrderUseCases } from './core/usecases/orders/OrderUseCases';
import { PurchaseUseCases } from './core/usecases/purchases/PurchaseUseCases';
import { FinanceUseCases } from './core/usecases/finance/FinanceUseCases';

// Controllers
import { AuthController } from './api/controllers/AuthController';
import { UserController } from './api/controllers/UserController';
import { InventoryController } from './api/controllers/InventoryController';
import { OrderController } from './api/controllers/OrderController';
import { PurchaseController } from './api/controllers/PurchaseController';
import { FinanceController } from './api/controllers/FinanceController';

// Routes
import { createAuthRouter } from './api/routes/authRoutes';
import { createUserRouter } from './api/routes/userRoutes';
import { createInventoryRouter } from './api/routes/inventoryRoutes';
import { createOrderRouter } from './api/routes/orderRoutes';
import { createPurchaseRouter } from './api/routes/purchaseRoutes';
import { createFinanceRouter } from './api/routes/financeRoutes';

// ─── Dependency Injection ──────────────────────────────────────────────────────

const userRepo = new UserRepository(prisma);
const inventoryRepo = new InventoryRepository(prisma);
const orderRepo = new OrderRepository(prisma);
const purchaseRepo = new PurchaseRepository(prisma);
const financeRepo = new FinanceRepository(prisma);

const authUseCases = new AuthUseCases(
  userRepo,
  config.jwtSecret,
  config.jwtExpiresIn,
  config.jwtRefreshSecret,
  config.jwtRefreshExpiresIn,
  config.bcryptRounds,
);
const userUseCases = new UserUseCases(userRepo, config.bcryptRounds);
const inventoryUseCases = new InventoryUseCases(inventoryRepo);
const orderUseCases = new OrderUseCases(orderRepo, inventoryRepo);
const purchaseUseCases = new PurchaseUseCases(purchaseRepo, inventoryRepo);
const financeUseCases = new FinanceUseCases(financeRepo);

const authController = new AuthController(authUseCases);
const userController = new UserController(userUseCases);
const inventoryController = new InventoryController(inventoryUseCases);
const orderController = new OrderController(orderUseCases);
const purchaseController = new PurchaseController(purchaseUseCases);
const financeController = new FinanceController(financeUseCases);

// ─── Express App ───────────────────────────────────────────────────────────────

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, createAuthRouter(authController));
app.use(`${API_PREFIX}/users`, createUserRouter(userController));
app.use(`${API_PREFIX}/inventory`, createInventoryRouter(inventoryController));
app.use(`${API_PREFIX}/orders`, createOrderRouter(orderController));
app.use(`${API_PREFIX}/purchases`, createPurchaseRouter(purchaseController));
app.use(`${API_PREFIX}/finance`, createFinanceRouter(financeController));

app.use(errorHandler);

// ─── Server Entry Point ────────────────────────────────────────────────────────

if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`SmartERP API running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
