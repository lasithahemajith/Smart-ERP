import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, Card, message, Tag, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, CarOutlined } from '@ant-design/icons';
import { ordersApi, inventoryApi } from '../../api';
import { Order, Customer, Product, Invoice } from '../../types';
import { useAppSelector } from '../../utils/hooks';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<string, string> = {
  PENDING: 'orange', APPROVED: 'blue', REJECTED: 'red',
  SHIPPED: 'cyan', DELIVERED: 'green', CANCELLED: 'default',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [orderForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes, invoicesRes] = await Promise.all([
        ordersApi.getOrders(),
        ordersApi.getCustomers(),
        inventoryApi.getProducts(),
        ordersApi.getInvoices(),
      ]);
      setOrders(ordersRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
    } catch {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateOrder = async (values: { customerId: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; notes?: string }) => {
    try {
      await ordersApi.createOrder(values);
      message.success('Order created');
      setOrderModal(false);
      orderForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to create order');
    }
  };

  const handleCreateCustomer = async (values: { name: string; email: string; phone?: string }) => {
    try {
      await ordersApi.createCustomer(values);
      message.success('Customer created');
      setCustomerModal(false);
      customerForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleAction = async (action: string, orderId: string) => {
    try {
      if (action === 'approve') await ordersApi.approveOrder(orderId);
      else if (action === 'reject') await ordersApi.rejectOrder(orderId);
      else if (action === 'ship') await ordersApi.shipOrder(orderId);
      else if (action === 'deliver') await ordersApi.deliverOrder(orderId);
      else if (action === 'cancel') await ordersApi.cancelOrder(orderId);
      else if (action === 'invoice') await ordersApi.generateInvoice(orderId);
      message.success('Action completed');
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Action failed');
    }
  };

  const orderColumns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber' },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Order) => (
        <Space size="small">
          {isManagerOrAdmin && record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleAction('approve', record.id)}>Approve</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleAction('reject', record.id)}>Reject</Button>
            </>
          )}
          {isManagerOrAdmin && record.status === 'APPROVED' && (
            <Button size="small" icon={<CarOutlined />} onClick={() => handleAction('ship', record.id)}>Ship</Button>
          )}
          {isManagerOrAdmin && record.status === 'SHIPPED' && (
            <Button size="small" type="primary" onClick={() => handleAction('deliver', record.id)}>Delivered</Button>
          )}
          {isManagerOrAdmin && ['APPROVED', 'SHIPPED'].includes(record.status) && (
            <Button size="small" onClick={() => handleAction('invoice', record.id)}>Invoice</Button>
          )}
          {['PENDING', 'APPROVED'].includes(record.status) && (
            <Popconfirm title="Cancel order?" onConfirm={() => handleAction('cancel', record.id)}>
              <Button size="small" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const invoiceColumns = [
    { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => new Date(d).toLocaleDateString() },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'PAID' ? 'green' : s === 'OVERDUE' ? 'red' : 'blue'}>{s}</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Invoice) => record.status === 'DRAFT' && isManagerOrAdmin ? (
        <Button size="small" type="primary" onClick={() => ordersApi.updateInvoiceStatus(record.id, 'SENT').then(() => { message.success('Invoice sent'); fetchData(); })}>
          Mark as Sent
        </Button>
      ) : record.status === 'SENT' && isManagerOrAdmin ? (
        <Button size="small" type="primary" onClick={() => ordersApi.updateInvoiceStatus(record.id, 'PAID').then(() => { message.success('Marked as paid'); fetchData(); })}>
          Mark as Paid
        </Button>
      ) : null,
    },
  ];

  const customerColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  ];

  return (
    <div>
      <Title level={2}>Sales & Orders</Title>

      <Tabs defaultActiveKey="orders" items={[
        {
          key: 'orders',
          label: 'Orders',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setOrderModal(true)}>Create Order</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={orders} columns={orderColumns} rowKey="id" loading={loading} scroll={{ x: true }} />
              </Card>
            </>
          ),
        },
        {
          key: 'invoices',
          label: 'Invoices',
          children: (
            <Card style={{ borderRadius: 8 }}>
              <Table dataSource={invoices} columns={invoiceColumns} rowKey="id" loading={loading} />
            </Card>
          ),
        },
        {
          key: 'customers',
          label: 'Customers',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setCustomerModal(true)}>Add Customer</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={customers} columns={customerColumns} rowKey="id" loading={loading} />
              </Card>
            </>
          ),
        },
      ]} />

      {/* Order Modal */}
      <Modal title="Create Order" open={orderModal} onCancel={() => setOrderModal(false)} footer={null} width={700}>
        <Form form={orderForm} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
            <Select placeholder="Select customer" showSearch optionFilterProp="children">
              {customers.map((c) => <Option key={c.id} value={c.id}>{c.name} ({c.email})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }} extra={<Button size="small" danger onClick={() => remove(name)}>Remove</Button>}>
                    <Space style={{ width: '100%' }} align="start">
                      <Form.Item {...rest} name={[name, 'productId']} label="Product" rules={[{ required: true }]} style={{ flex: 2, marginBottom: 0 }}>
                        <Select placeholder="Select product" showSearch optionFilterProp="children" style={{ minWidth: 200 }}>
                          {products.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="Qty" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                        <InputNumber min={1} style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'unitPrice']} label="Price ($)" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                        <InputNumber min={0} step={0.01} style={{ width: 100 }} />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
              </>
            )}
          </Form.List>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 16 }}>
            <Space><Button onClick={() => setOrderModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Create Order</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Customer Modal */}
      <Modal title="Add Customer" open={customerModal} onCancel={() => setCustomerModal(false)} footer={null}>
        <Form form={customerForm} layout="vertical" onFinish={handleCreateCustomer}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setCustomerModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrdersPage;
