export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  lowStockAlert: number;
  unit: string;
  categoryId: string;
  totalStock?: number;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  totalAmount: number;
  customerId: string;
  createdById: string;
  approvedById?: string;
  items?: OrderItem[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  totalAmount: number;
  orderId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  unitCost: number;
  total: number;
  received: number;
  productId: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  supplierId: string;
  createdById: string;
  items?: PurchaseOrderItem[];
  expectedDate?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'SALARIES' | 'RENT' | 'UTILITIES' | 'MARKETING' | 'SUPPLIES' | 'MAINTENANCE' | 'TRAVEL' | 'OTHER';
  description?: string;
  date: string;
  createdById: string;
  createdAt: string;
}

export interface ProfitDashboard {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyData: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
