'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message } from 'antd';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      message.success('登录成功！');

      // 等待认证状态更新后再跳转
      setTimeout(() => {
        router.push('/');
        router.refresh(); // 刷新页面确保状态更新
      }, 500);
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查您的邮箱和密码');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">登录</h1>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' },
            ]}
          >
            <Input size="large" placeholder="your@email.com" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入您的密码！' }]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <span className="text-gray-600">还没有账号？</span>{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800">
            立即注册
          </Link>
        </div>

        <div className="text-center mt-2">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

