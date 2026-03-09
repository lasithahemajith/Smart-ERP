import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: object) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Users
export const usersApi = {
  getAll: (params?: object) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: object) => api.post('/users', data),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
};

// Inventory
export const inventoryApi = {
  getProducts: (params?: object) => api.get('/inventory/products', { params }),
  getProduct: (id: string) => api.get(`/inventory/products/${id}`),
  createProduct: (data: object) => api.post('/inventory/products', data),
  updateProduct: (id: string, data: object) => api.put(`/inventory/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/inventory/products/${id}`),
  getLowStock: () => api.get('/inventory/products/low-stock'),
  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (data: object) => api.post('/inventory/warehouses', data),
  updateWarehouse: (id: string, data: object) => api.put(`/inventory/warehouses/${id}`, data),
  deleteWarehouse: (id: string) => api.delete(`/inventory/warehouses/${id}`),
  adjustStock: (data: object) => api.post('/inventory/stock/adjust', data),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data: object) => api.post('/inventory/categories', data),
};

// Orders
export const ordersApi = {
  getOrders: (params?: object) => api.get('/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  createOrder: (data: object) => api.post('/orders', data),
  approveOrder: (id: string) => api.post(`/orders/${id}/approve`),
  rejectOrder: (id: string) => api.post(`/orders/${id}/reject`),
  shipOrder: (id: string) => api.post(`/orders/${id}/ship`),
  deliverOrder: (id: string) => api.post(`/orders/${id}/deliver`),
  cancelOrder: (id: string) => api.post(`/orders/${id}/cancel`),
  getCustomers: () => api.get('/orders/customers'),
  createCustomer: (data: object) => api.post('/orders/customers', data),
  getInvoices: (params?: object) => api.get('/orders/invoices/all', { params }),
  generateInvoice: (orderId: string, data?: object) => api.post(`/orders/invoices/${orderId}/generate`, data),
  updateInvoiceStatus: (id: string, status: string) => api.put(`/orders/invoices/${id}/status`, { status }),
};

// Purchases
export const purchasesApi = {
  getPOs: (params?: object) => api.get('/purchases', { params }),
  getPO: (id: string) => api.get(`/purchases/${id}`),
  createPO: (data: object) => api.post('/purchases', data),
  approvePO: (id: string) => api.post(`/purchases/${id}/approve`),
  rejectPO: (id: string) => api.post(`/purchases/${id}/reject`),
  receivePO: (id: string, data: object) => api.post(`/purchases/${id}/receive`, data),
  getSuppliers: () => api.get('/purchases/suppliers'),
  createSupplier: (data: object) => api.post('/purchases/suppliers', data),
  updateSupplier: (id: string, data: object) => api.put(`/purchases/suppliers/${id}`, data),
  deleteSupplier: (id: string) => api.delete(`/purchases/suppliers/${id}`),
};

// Finance
export const financeApi = {
  getExpenses: (params?: object) => api.get('/finance/expenses', { params }),
  createExpense: (data: object) => api.post('/finance/expenses', data),
  updateExpense: (id: string, data: object) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),
  getExpenseSummary: (params?: object) => api.get('/finance/expenses/summary', { params }),
  getMonthlyRevenue: (year?: number) => api.get('/finance/revenue/monthly', { params: { year } }),
  getProfitDashboard: () => api.get('/finance/profit-dashboard'),
  getSalesTrends: (period?: string) => api.get('/finance/sales-trends', { params: { period } }),
  getInventoryAnalytics: () => api.get('/finance/inventory-analytics'),
};
