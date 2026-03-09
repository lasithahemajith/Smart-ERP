import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, Card, message, Tag, Tabs, Statistic, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { financeApi } from '../../api';
import { Expense, ProfitDashboard } from '../../types';

const { Title } = Typography;
const { Option } = Select;

const EXPENSE_CATEGORIES = ['SALARIES', 'RENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'MAINTENANCE', 'TRAVEL', 'OTHER'];

const FinancePage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profit, setProfit] = useState<ProfitDashboard | null>(null);
  const [salesTrends, setSalesTrends] = useState<Array<{ label: string; sales: number; revenue: number }>>([]);
  const [expenseSummary, setExpenseSummary] = useState<{ total: number; byCategory: Array<{ category: string; total: number }> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, profitRes, trendsRes, summaryRes] = await Promise.all([
        financeApi.getExpenses(),
        financeApi.getProfitDashboard(),
        financeApi.getSalesTrends('year'),
        financeApi.getExpenseSummary(),
      ]);
      setExpenses(expRes.data.data || []);
      setProfit(profitRes.data.data);
      setSalesTrends(trendsRes.data.data || []);
      setExpenseSummary(summaryRes.data.data);
    } catch {
      message.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateExpense = async (values: Partial<Expense>) => {
    try {
      await financeApi.createExpense(values);
      message.success('Expense recorded');
      setExpenseModal(false);
      expenseForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to create expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await financeApi.deleteExpense(id);
      message.success('Expense deleted');
      fetchData();
    } catch {
      message.error('Failed to delete expense');
    }
  };

  const expenseColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Expense) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteExpense(record.id)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Finance Module</Title>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 8, borderTop: '3px solid #667eea' }}>
            <Statistic title="Total Revenue" value={profit?.totalRevenue ?? 0} prefix="$" precision={2} valueStyle={{ color: '#667eea' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 8, borderTop: '3px solid #f5576c' }}>
            <Statistic title="Total Expenses" value={profit?.totalExpenses ?? 0} prefix="$" precision={2} valueStyle={{ color: '#f5576c' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 8, borderTop: '3px solid #43e97b' }}>
            <Statistic title="Net Profit" value={profit?.netProfit ?? 0} prefix="$" precision={2} valueStyle={{ color: (profit?.netProfit ?? 0) >= 0 ? '#43e97b' : '#f5576c' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: 8, borderTop: '3px solid #4facfe' }}>
            <Statistic title="Profit Margin" value={profit?.profitMargin ?? 0} suffix="%" precision={1} valueStyle={{ color: '#4facfe' }} />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: 'Revenue Overview',
          children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="Annual Revenue vs Expenses" style={{ borderRadius: 8 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={profit?.monthlyData || []}>
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
              <Col xs={24} lg={8}>
                <Card title="Expenses by Category" style={{ borderRadius: 8 }}>
                  {expenseSummary?.byCategory?.map((item) => (
                    <div key={item.category} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Tag color="blue">{item.category}</Tag>
                        <span>${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {!expenseSummary?.byCategory?.length && <Typography.Text type="secondary">No expense data</Typography.Text>}
                </Card>
              </Col>
              <Col xs={24}>
                <Card title="Sales Trends (Year)" style={{ borderRadius: 8 }}>
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
            </Row>
          ),
        },
        {
          key: 'expenses',
          label: 'Expenses',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setExpenseModal(true)}>Record Expense</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={expenses} columns={expenseColumns} rowKey="id" loading={loading} />
              </Card>
            </>
          ),
        },
      ]} />

      {/* Expense Modal */}
      <Modal title="Record Expense" open={expenseModal} onCancel={() => setExpenseModal(false)} footer={null}>
        <Form form={expenseForm} layout="vertical" onFinish={handleCreateExpense}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="amount" label="Amount ($)" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              {EXPENSE_CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setExpenseModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancePage;
