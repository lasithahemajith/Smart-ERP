import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Table, Tag, List, Progress, Alert } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  WarningOutlined,
  TeamOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { financeApi, inventoryApi, ordersApi } from '../../api';
import { ProfitDashboard, Product, Order } from '../../types';

const { Title, Text } = Typography;
const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

const DashboardPage: React.FC = () => {
  const [profit, setProfit] = useState<ProfitDashboard | null>(null);
  const [salesTrends, setSalesTrends] = useState<Array<{ label: string; sales: number; revenue: number }>>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [inventoryAnalytics, setInventoryAnalytics] = useState<{
    totalProducts: number; totalStockValue: number; lowStockCount: number;
    topSellingProducts: Array<{ productId: string; name: string; sold: number; revenue: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profitRes, trendsRes, lowStockRes, ordersRes, analyticsRes] = await Promise.all([
          financeApi.getProfitDashboard(),
          financeApi.getSalesTrends('month'),
          inventoryApi.getLowStock(),
          ordersApi.getOrders({ status: 'PENDING' }),
          financeApi.getInventoryAnalytics(),
        ]);
        setProfit(profitRes.data.data);
        setSalesTrends(trendsRes.data.data);
        setLowStock(lowStockRes.data.data?.slice(0, 5) || []);
        setRecentOrders(ordersRes.data.data?.slice(0, 5) || []);
        setInventoryAnalytics(analyticsRes.data.data);
      } catch {
        setError('Failed to load dashboard data. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  const statCards = [
    { title: 'Total Revenue', value: profit?.totalRevenue ?? 0, prefix: '$', icon: <DollarOutlined />, color: '#667eea' },
    { title: 'Total Expenses', value: profit?.totalExpenses ?? 0, prefix: '$', icon: <ShoppingOutlined />, color: '#f5576c' },
    { title: 'Net Profit', value: profit?.netProfit ?? 0, prefix: '$', icon: <RiseOutlined />, color: '#43e97b' },
    { title: 'Profit Margin', value: profit?.profitMargin ?? 0, suffix: '%', icon: <TeamOutlined />, color: '#4facfe' },
    { title: 'Total Products', value: inventoryAnalytics?.totalProducts ?? 0, icon: <ShoppingCartOutlined />, color: '#764ba2' },
    { title: 'Low Stock Items', value: inventoryAnalytics?.lowStockCount ?? 0, icon: <WarningOutlined />, color: '#f093fb' },
  ];

  const orderColumns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `$${v.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="orange">{s}</Tag> },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Dashboard</Title>

      {error && <Alert message={error} type="warning" showIcon closable style={{ marginBottom: 16 }} />}

      {/* KPI Stats */}
      <Row gutter={[16, 16]}>
        {statCards.map((stat, i) => (
          <Col xs={24} sm={12} lg={4} key={i}>
            <Card style={{ borderRadius: 8, borderTop: `3px solid ${stat.color}` }}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{stat.title}</Text>}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                precision={stat.prefix === '$' ? 2 : 0}
                valueStyle={{ fontSize: 20, color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Sales Trends (Monthly)" style={{ borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={salesTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={2} name="Revenue ($)" />
                <Line type="monotone" dataKey="sales" stroke="#43e97b" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Monthly P&L" style={{ borderRadius: 8 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={profit?.monthlyData?.slice(-6) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#667eea" name="Revenue" />
                <Bar dataKey="expenses" fill="#f5576c" name="Expenses" />
                <Bar dataKey="profit" fill="#43e97b" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Top Selling Products" style={{ borderRadius: 8 }}>
            {inventoryAnalytics?.topSellingProducts?.length ? (
              <List
                size="small"
                dataSource={inventoryAnalytics.topSellingProducts}
                renderItem={(item, idx) => (
                  <List.Item key={item.productId}>
                    <List.Item.Meta
                      avatar={<div style={{ width: 24, height: 24, borderRadius: '50%', background: COLORS[idx % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>{idx + 1}</div>}
                      title={item.name}
                      description={`${item.sold} sold · $${item.revenue.toFixed(2)}`}
                    />
                    <Progress percent={Math.min(100, (item.sold / (inventoryAnalytics.topSellingProducts[0]?.sold || 1)) * 100)} showInfo={false} strokeColor={COLORS[idx % COLORS.length]} style={{ width: 60 }} />
                  </List.Item>
                )}
              />
            ) : <Text type="secondary">No sales data yet</Text>}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Low Stock Alerts" style={{ borderRadius: 8 }}>
            {lowStock.length > 0 ? (
              <List
                size="small"
                dataSource={lowStock}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ color: '#f5576c', fontSize: 16 }} />}
                      title={item.name}
                      description={`SKU: ${item.sku} · Stock: ${item.totalStock ?? 0} (min: ${item.lowStockAlert})`}
                    />
                    <Tag color="red">Low</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">All products are well-stocked ✓</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Pending Orders" style={{ borderRadius: 8 }}>
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
            {recentOrders.length === 0 && <Text type="secondary">No pending orders</Text>}
          </Card>
        </Col>
      </Row>

      {/* Revenue by category pie */}
      {(inventoryAnalytics?.topSellingProducts?.length ?? 0) > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={8}>
            <Card title="Revenue Distribution" style={{ borderRadius: 8 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={inventoryAnalytics!.topSellingProducts}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {inventoryAnalytics!.topSellingProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardPage;
