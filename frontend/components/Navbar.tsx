'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown, message } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabaseClient';

const { Header } = Layout;

export default function Navbar() {
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      message.success('已退出登录');
      router.push('/');
    } catch (error) {
      message.error('退出失败');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => router.push('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="bg-white shadow-sm flex items-center justify-between px-8">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          🧳 AI 旅行规划
        </Link>

        {user && (
          <Menu mode="horizontal" className="border-0 flex-1" selectedKeys={[]}>
            <Menu.Item key="home" icon={<HomeOutlined />}>
              <Link href="/">首页</Link>
            </Menu.Item>
            <Menu.Item key="trips" icon={<UnorderedListOutlined />}>
              <Link href="/trips">我的行程</Link>
            </Menu.Item>
            <Menu.Item key="plan" icon={<PlusOutlined />}>
              <Link href="/plan">创建行程</Link>
            </Menu.Item>
          </Menu>
        )}
      </div>

      <div>
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} className="cursor-pointer bg-blue-500" />
          </Dropdown>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button type="link">登录</Button>
            </Link>
            <Link href="/auth/signup">
              <Button type="primary">注册</Button>
            </Link>
          </div>
        )}
      </div>
    </Header>
  );
}

