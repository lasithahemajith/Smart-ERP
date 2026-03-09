import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, Card, message, Tag, Tabs, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons';
import { purchasesApi, inventoryApi } from '../../api';
import { PurchaseOrder, Supplier, Product } from '../../types';
import { useAppSelector } from '../../utils/hooks';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<string, string> = {
  DRAFT: 'default', PENDING: 'orange', APPROVED: 'blue', RECEIVED: 'green', CANCELLED: 'red',
};

const PurchasesPage: React.FC = () => {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [poModal, setPOModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState<string | null>(null);
  const [poForm] = Form.useForm();
  const [supplierForm] = Form.useForm();
  const [receiveForm] = Form.useForm();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, suppRes, prodRes, whRes] = await Promise.all([
        purchasesApi.getPOs(),
        purchasesApi.getSuppliers(),
        inventoryApi.getProducts(),
        inventoryApi.getWarehouses(),
      ]);
      setPOs(posRes.data.data || []);
      setSuppliers(suppRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setWarehouses(whRes.data.data || []);
    } catch {
      message.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreatePO = async (values: { supplierId: string; items: Array<{ productId: string; quantity: number; unitCost: number }> }) => {
    try {
      await purchasesApi.createPO(values);
      message.success('Purchase Order created');
      setPOModal(false);
      poForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to create PO');
    }
  };

  const handleCreateSupplier = async (values: { name: string; email: string; phone?: string }) => {
    try {
      await purchasesApi.createSupplier(values);
      message.success('Supplier created');
      setSupplierModal(false);
      supplierForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to create supplier');
    }
  };

  const handleReceivePO = async (values: { warehouseId: string }) => {
    if (!receiveModal) return;
    try {
      await purchasesApi.receivePO(receiveModal, values);
      message.success('PO received - stock updated');
      setReceiveModal(null);
      receiveForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to receive PO');
    }
  };

  const poColumns = [
    { title: 'PO #', dataIndex: 'poNumber', key: 'poNumber' },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: PurchaseOrder) => (
        <Space>
          {isManagerOrAdmin && record.status === 'DRAFT' && (
            <Button size="small" type="primary" onClick={async () => {
              await purchasesApi.approvePO(record.id);
              message.success('PO submitted for approval');
              fetchData();
            }}>Submit</Button>
          )}
          {isManagerOrAdmin && record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={async () => {
                await purchasesApi.approvePO(record.id);
                message.success('PO approved');
                fetchData();
              }}>Approve</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={async () => {
                await purchasesApi.rejectPO(record.id);
                message.success('PO rejected');
                fetchData();
              }}>Reject</Button>
            </>
          )}
          {isManagerOrAdmin && record.status === 'APPROVED' && (
            <Button size="small" icon={<InboxOutlined />} onClick={() => setReceiveModal(record.id)}>Receive</Button>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm title="Cancel PO?" onConfirm={async () => { await purchasesApi.rejectPO(record.id); fetchData(); }}>
              <Button size="small" danger>Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const supplierColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Supplier) => (
        <Popconfirm title="Delete supplier?" onConfirm={async () => {
          await purchasesApi.deleteSupplier(record.id);
          message.success('Supplier deleted');
          fetchData();
        }}>
          <Button size="small" danger>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Purchase Management</Title>

      <Tabs defaultActiveKey="pos" items={[
        {
          key: 'pos',
          label: 'Purchase Orders',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setPOModal(true)}>Create PO</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={pos} columns={poColumns} rowKey="id" loading={loading} scroll={{ x: true }} />
              </Card>
            </>
          ),
        },
        {
          key: 'suppliers',
          label: 'Suppliers',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setSupplierModal(true)}>Add Supplier</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={suppliers} columns={supplierColumns} rowKey="id" loading={loading} />
              </Card>
            </>
          ),
        },
      ]} />

      {/* PO Modal */}
      <Modal title="Create Purchase Order" open={poModal} onCancel={() => setPOModal(false)} footer={null} width={700}>
        <Form form={poForm} layout="vertical" onFinish={handleCreatePO}>
          <Form.Item name="supplierId" label="Supplier" rules={[{ required: true }]}>
            <Select placeholder="Select supplier">
              {suppliers.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.List name="items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }} extra={<Button size="small" danger onClick={() => remove(name)}>Remove</Button>}>
                    <Space style={{ width: '100%' }} align="start">
                      <Form.Item {...rest} name={[name, 'productId']} label="Product" rules={[{ required: true }]} style={{ flex: 2, marginBottom: 0 }}>
                        <Select placeholder="Select product" style={{ minWidth: 180 }}>
                          {products.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="Qty" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                        <InputNumber min={1} style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'unitCost']} label="Unit Cost ($)" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
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
            <Space><Button onClick={() => setPOModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Supplier Modal */}
      <Modal title="Add Supplier" open={supplierModal} onCancel={() => setSupplierModal(false)} footer={null}>
        <Form form={supplierForm} layout="vertical" onFinish={handleCreateSupplier}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="contactPerson" label="Contact Person"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setSupplierModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Receive PO Modal */}
      <Modal title="Receive Purchase Order" open={!!receiveModal} onCancel={() => setReceiveModal(null)} footer={null}>
        <Form form={receiveForm} layout="vertical" onFinish={handleReceivePO}>
          <Form.Item name="warehouseId" label="Target Warehouse" rules={[{ required: true }]}>
            <Select placeholder="Select warehouse">
              {warehouses.map((w) => <Option key={w.id} value={w.id}>{w.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setReceiveModal(null)}>Cancel</Button><Button type="primary" htmlType="submit">Receive & Update Stock</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchasesPage;
