'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message } from 'antd';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string; username: string }) => {
    setLoading(true);
    try {
      // 注册用户
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
          },
        },
      });

      if (error) throw error;

      message.success('注册成功！正在跳转...');

      // 如果邮箱验证被禁用，用户会自动登录，跳转到首页
      // 如果启用了邮箱验证，跳转到登录页
      setTimeout(() => {
        if (data.session) {
          // 已自动登录
          router.push('/');
          router.refresh();
        } else {
          // 需要验证邮箱
          message.info('请检查您的邮箱以验证账号');
          router.push('/auth/login');
        }
      }, 500);
    } catch (error: any) {
      message.error(error.message || '注册失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">注册</h1>

        <Form
          name="signup"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入您的用户名！' }]}
          >
            <Input size="large" placeholder="您的用户名" />
          </Form.Item>

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
            rules={[
              { required: true, message: '请输入您的密码！' },
              { min: 6, message: '密码至少需要6个字符！' },
            ]}
          >
            <Input.Password size="large" placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认您的密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
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
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <span className="text-gray-600">已有账号？</span>{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
            立即登录
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

