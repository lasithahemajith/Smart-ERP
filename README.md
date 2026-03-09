# SmartERP – SME Business Management System

A full-featured Enterprise Resource Planning (ERP) system built with Clean Architecture principles for Small and Medium Enterprises (SMEs).

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
backend/src/
 ├── core/                   # Business logic (framework-independent)
 │   ├── entities/           # Domain entities (User, Product, Order, etc.)
 │   ├── usecases/           # Business use cases
 │   └── interfaces/         # Repository & service contracts
 │
 ├── infrastructure/         # External concerns
 │   ├── database/           # Prisma client & seed
 │   └── repositories/       # Prisma repository implementations
 │
 ├── api/                    # HTTP layer
 │   ├── controllers/        # Request/response handling
 │   ├── routes/             # Express route definitions
 │   └── middlewares/        # Auth, RBAC, error handling, validation
 │
 └── config/                 # App configuration & logger
```

## 🚀 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + TypeScript | Runtime & type safety |
| Express.js | HTTP server |
| Prisma ORM | Database access layer |
| PostgreSQL | Primary database |
| JWT | Authentication (access + refresh tokens) |
| bcryptjs | Password hashing |
| Helmet + CORS | Security hardening |
| Winston | Structured logging |
| Jest + ts-jest | Unit testing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tooling |
| Ant Design | UI component library |
| Redux Toolkit | State management |
| React Router v6 | Client-side routing |
| Recharts | Data visualization |
| Axios | HTTP client |

## 📋 Core Modules

### 1. User & Role Management (RBAC)
- Three roles: **Admin**, **Manager**, **Employee**
- JWT authentication with access + refresh tokens
- Role-Based Access Control (RBAC) on all endpoints
- User CRUD with status management (Active/Inactive/Suspended)

### 2. Inventory Management
- Product catalog with SKU, pricing, and categorization
- Multi-warehouse stock tracking
- **Low stock alerts** with configurable thresholds
- Stock adjustment (add/remove from warehouse)
- Category management

### 3. Sales & Orders
- Order creation with multiple line items
- **Approval workflow**: PENDING → APPROVED → SHIPPED → DELIVERED
- Invoice generation with due dates
- Customer management
- Order cancellation

### 4. Purchase Management
- Supplier management (CRUD)
- Purchase order creation and tracking
- **Stock auto-update** on PO receipt
- Approval workflow: DRAFT → PENDING → APPROVED → RECEIVED

### 5. Finance Module
- Expense tracking with categories (Salaries, Rent, Utilities, etc.)
- Monthly revenue reports
- **Profit & Loss dashboard**
- Profit margin calculation
- Expense summary by category

### 6. Reporting Dashboard
- Sales trends (weekly/monthly/yearly)
- Inventory analytics (top-selling products, stock value)
- Monthly P&L charts
- Low stock alerts
- Pending order monitoring

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at `http://localhost:5173`

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Users (Admin/Manager)
- `GET /api/v1/users` - List all users
- `POST /api/v1/users` - Create user (Admin)
- `PUT /api/v1/users/:id` - Update user (Admin)
- `DELETE /api/v1/users/:id` - Delete user (Admin)

### Inventory
- `GET /api/v1/inventory/products` - List products (with stock)
- `GET /api/v1/inventory/products/low-stock` - Low stock alerts
- `POST /api/v1/inventory/stock/adjust` - Adjust warehouse stock
- `GET/POST /api/v1/inventory/warehouses` - Warehouse management

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/:id/approve` - Approve (Manager+)
- `POST /api/v1/orders/:id/ship` - Mark as shipped
- `POST /api/v1/orders/invoices/:orderId/generate` - Generate invoice

### Purchases
- `GET /api/v1/purchases` - List purchase orders
- `POST /api/v1/purchases` - Create purchase order
- `POST /api/v1/purchases/:id/approve` - Approve PO
- `POST /api/v1/purchases/:id/receive` - Receive PO (updates stock)

### Finance
- `GET /api/v1/finance/expenses` - List expenses
- `POST /api/v1/finance/expenses` - Record expense
- `GET /api/v1/finance/profit-dashboard` - P&L dashboard
- `GET /api/v1/finance/sales-trends` - Sales trends
- `GET /api/v1/finance/inventory-analytics` - Inventory analytics

## 👥 Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smarterp.com | admin123! |
| Manager | manager@smarterp.com | manager123! |
| Employee | employee@smarterp.com | employee123! |

## 🧪 Testing

```bash
cd backend
npm test
```

Tests cover: Auth use cases, User management, Inventory management.

## 🏛️ Software Engineering Practices

- **Clean Architecture**: Domain logic isolated from frameworks
- **Dependency Inversion**: Infrastructure depends on core, not vice versa
- **RBAC**: Fine-grained role-based access control on all endpoints
- **JWT + Refresh Tokens**: Secure stateless authentication
- **Input Validation**: express-validator on all POST/PUT endpoints
- **Centralized Error Handling**: AppError class with middleware
- **Structured Logging**: Winston with file and console transports
- **Type Safety**: Full TypeScript on both frontend and backend
