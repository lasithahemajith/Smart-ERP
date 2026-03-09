import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { login } from '../../store/slices/authSlice';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading } = useAppSelector((s) => s.auth);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      navigate('/dashboard');
    } else {
      setError((result.payload as string) || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Space direction="vertical" size={4}>
            <ApartmentOutlined style={{ fontSize: 48, color: '#667eea' }} />
            <Title level={2} style={{ margin: 0 }}>SmartERP</Title>
            <Text type="secondary">SME Business Management System</Text>
          </Space>

          {error && <Alert message={error} type="error" showIcon />}

          <Form layout="vertical" onFinish={onFinish} size="large" style={{ width: '100%' }}>
            <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<UserOutlined />} placeholder="Email address" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block style={{ background: '#667eea', borderColor: '#667eea' }}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Demo: admin@smarterp.com / admin123!
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
