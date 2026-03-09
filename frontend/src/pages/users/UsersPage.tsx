import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Typography, Card, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usersApi } from '../../api';
import { User } from '../../types';
import { useAppSelector } from '../../utils/hooks';

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const currentUser = useAppSelector((s) => s.auth.user);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getAll();
      setUsers(data.data || []);
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (values: { email: string; password: string; firstName: string; lastName: string; role: string; status: string }) => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await usersApi.create(values);
        message.success('User created successfully');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ ...user });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      message.success('User deleted');
      fetchUsers();
    } catch {
      message.error('Failed to delete user');
    }
  };

  const columns = [
    { title: 'Name', key: 'name', render: (_: unknown, r: User) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: (r: string) => <Tag color={r === 'ADMIN' ? 'red' : r === 'MANAGER' ? 'blue' : 'green'}>{r}</Tag>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={s === 'ACTIVE' ? 'green' : 'default'}>{s}</Tag>,
    },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record.id)} disabled={record.id === currentUser?.id}>
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.id === currentUser?.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>User Management</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }}>
          Add User
        </Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table dataSource={users} columns={columns} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingUser(null); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Option value="ADMIN">Admin</Option>
              <Option value="MANAGER">Manager</Option>
              <Option value="EMPLOYEE">Employee</Option>
            </Select>
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
                <Option value="SUSPENDED">Suspended</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">{editingUser ? 'Update' : 'Create'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
