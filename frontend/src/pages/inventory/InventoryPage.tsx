import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, Card, message, Popconfirm, Tag, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { inventoryApi } from '../../api';
import { Product, Warehouse, Category } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [warehouseModal, setWarehouseModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm] = Form.useForm();
  const [warehouseForm] = Form.useForm();
  const [stockForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, whRes, catRes] = await Promise.all([
        inventoryApi.getProducts(),
        inventoryApi.getWarehouses(),
        inventoryApi.getCategories(),
      ]);
      setProducts(prodRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch {
      message.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProductSubmit = async (values: Partial<Product>) => {
    try {
      if (editingProduct) {
        await inventoryApi.updateProduct(editingProduct.id, values);
        message.success('Product updated');
      } else {
        await inventoryApi.createProduct(values);
        message.success('Product created');
      }
      setProductModal(false);
      productForm.resetFields();
      setEditingProduct(null);
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await inventoryApi.deleteProduct(id);
      message.success('Product deleted');
      fetchData();
    } catch {
      message.error('Failed to delete product');
    }
  };

  const handleWarehouseSubmit = async (values: { name: string; location: string }) => {
    try {
      await inventoryApi.createWarehouse(values);
      message.success('Warehouse created');
      setWarehouseModal(false);
      warehouseForm.resetFields();
      fetchData();
    } catch {
      message.error('Failed to create warehouse');
    }
  };

  const handleStockAdjust = async (values: { productId: string; warehouseId: string; delta: number }) => {
    try {
      await inventoryApi.adjustStock(values);
      message.success('Stock adjusted');
      setStockModal(false);
      stockForm.resetFields();
      fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const productColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (s: string) => <Tag>{s}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Cost', dataIndex: 'costPrice', key: 'costPrice', render: (v: number) => `$${v?.toFixed(2)}` },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Stock', dataIndex: 'totalStock', key: 'totalStock',
      render: (v: number, r: Product) => (
        <Text style={{ color: (v ?? 0) <= r.lowStockAlert ? '#f5576c' : '#52c41a' }}>
          {v ?? 0} {(v ?? 0) <= r.lowStockAlert && <WarningOutlined />}
        </Text>
      ),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingProduct(record); productForm.setFieldsValue(record); setProductModal(true); }} />
          <Popconfirm title="Delete product?" onConfirm={() => handleDeleteProduct(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const warehouseColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
  ];

  return (
    <div>
      <Title level={2}>Inventory Management</Title>

      <Tabs defaultActiveKey="products" items={[
        {
          key: 'products',
          label: 'Products',
          children: (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingProduct(null); productForm.resetFields(); setProductModal(true); }}>Add Product</Button>
                <Button icon={<PlusOutlined />} onClick={() => setStockModal(true)}>Adjust Stock</Button>
              </div>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={products} columns={productColumns} rowKey="id" loading={loading} scroll={{ x: true }} />
              </Card>
            </>
          ),
        },
        {
          key: 'warehouses',
          label: 'Warehouses',
          children: (
            <>
              <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setWarehouseModal(true)}>Add Warehouse</Button>
              <Card style={{ borderRadius: 8 }}>
                <Table dataSource={warehouses} columns={warehouseColumns} rowKey="id" loading={loading} />
              </Card>
            </>
          ),
        },
      ]} />

      {/* Product Modal */}
      <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} open={productModal} onCancel={() => { setProductModal(false); setEditingProduct(null); }} footer={null} width={600}>
        <Form form={productForm} layout="vertical" onFinish={handleProductSubmit}>
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select category">
              {categories.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="price" label="Selling Price ($)" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="costPrice" label="Cost Price ($)" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="unit" label="Unit" style={{ flex: 1 }}><Input placeholder="pcs" /></Form.Item>
            <Form.Item name="lowStockAlert" label="Low Stock Alert" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setProductModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Save</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Warehouse Modal */}
      <Modal title="Add Warehouse" open={warehouseModal} onCancel={() => setWarehouseModal(false)} footer={null}>
        <Form form={warehouseForm} layout="vertical" onFinish={handleWarehouseSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setWarehouseModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal title="Adjust Stock" open={stockModal} onCancel={() => setStockModal(false)} footer={null}>
        <Form form={stockForm} layout="vertical" onFinish={handleStockAdjust}>
          <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
            <Select placeholder="Select product">
              {products.map((p) => <Option key={p.id} value={p.id}>{p.name} ({p.sku})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="warehouseId" label="Warehouse" rules={[{ required: true }]}>
            <Select placeholder="Select warehouse">
              {warehouses.map((w) => <Option key={w.id} value={w.id}>{w.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="delta" label="Quantity Change (+ add / - remove)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space><Button onClick={() => setStockModal(false)}>Cancel</Button><Button type="primary" htmlType="submit">Adjust</Button></Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
