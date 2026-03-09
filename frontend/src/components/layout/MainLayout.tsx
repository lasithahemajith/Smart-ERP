import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DollarOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  UserOutlined,
  ApartmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { logout } from '../../store/slices/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/users', icon: <TeamOutlined />, label: 'Users', roles: ['ADMIN', 'MANAGER'] },
    { key: '/inventory', icon: <InboxOutlined />, label: 'Inventory' },
    { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Sales & Orders' },
    { key: '/purchases', icon: <ShoppingOutlined />, label: 'Purchases', roles: ['ADMIN', 'MANAGER'] },
    { key: '/finance', icon: <DollarOutlined />, label: 'Finance', roles: ['ADMIN', 'MANAGER'] },
  ].filter((item) => !item.roles || item.roles.includes(user?.role ?? ''));

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile', onClick: () => navigate('/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        trigger={null}
        style={{ background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' }}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <ApartmentOutlined style={{ fontSize: 28, color: 'white' }} />
          {!collapsed && <Text strong style={{ color: 'white', marginLeft: 8, fontSize: 16 }}>SmartERP</Text>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.85)',
          }}
          theme="dark"
        />
      </Sider>

      <Layout>
        <Header style={{ padding: '0 24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={0}>
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar style={{ background: '#667eea' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{user?.role}</Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '24px', padding: 24, background: '#f5f5f5', borderRadius: 8, minHeight: 280, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
