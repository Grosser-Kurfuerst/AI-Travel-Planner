'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Button, message, Tag, Space } from 'antd';
import { useUser } from '@/hooks/useUser';
import { supabase, Profile } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        form.setFieldsValue({
          username: data.username,
          interests: data.preferences?.interests?.join(', ') || '',
        });
      }
    } catch (error: any) {
      message.error('加载个人信息失败：' + error.message);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const interests = values.interests
        ? values.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          username: values.username,
          preferences: {
            interests,
          },
        });

      if (error) throw error;

      message.success('保存成功！');
      loadProfile();
    } catch (error: any) {
      message.error('保存失败：' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card title="个人信息">
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-1">邮箱</div>
            <div className="text-base">{user.email}</div>
          </div>

          <Form form={form} onFinish={handleSave} layout="vertical">
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              label="兴趣爱好"
              name="interests"
              extra="多个兴趣用逗号分隔，例如：美食, 摄影, 历史文化"
            >
              <Input placeholder="例如：美食, 摄影, 历史文化" />
            </Form.Item>

            {profile?.preferences?.interests && profile.preferences.interests.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">当前兴趣标签</div>
                <Space wrap>
                  {profile.preferences.interests.map((interest: string, index: number) => (
                    <Tag key={index} color="blue">
                      {interest}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving} block>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

