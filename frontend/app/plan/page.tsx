'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Card, DatePicker } from 'antd';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function PlanPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const onFinish = async (values: any) => {
    if (!user) {
      message.error('请先登录！');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      // 调用 Supabase Edge Function 生成行程
      const { data, error } = await supabase.functions.invoke('generate-trip', {
        body: {
          inputType: 'text',
          content: values.description,
          destination: values.destination,
          dateRange: values.dateRange ? [
            values.dateRange[0].format('YYYY-MM-DD'),
            values.dateRange[1].format('YYYY-MM-DD')
          ] : null,
          budget: values.budget,
        },
      });

      if (error) throw error;

      message.success('行程生成成功！');
      router.push(`/trips/${data.tripId}`);
    } catch (error: any) {
      message.error(error.message || '生成行程失败，请稍后重试');
      console.error('Error generating trip:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <h1 className="text-3xl font-bold mb-6">创建新行程</h1>

          <Form
            name="plan"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              label="目的地"
              name="destination"
              rules={[{ required: true, message: '请输入目的地！' }]}
            >
              <Input size="large" placeholder="例如：日本东京" />
            </Form.Item>

            <Form.Item
              label="出行日期"
              name="dateRange"
              rules={[{ required: true, message: '请选择出行日期！' }]}
            >
              <RangePicker
                size="large"
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              label="预算（元）"
              name="budget"
            >
              <Input
                size="large"
                type="number"
                placeholder="例如：5000"
                prefix="¥"
              />
            </Form.Item>

            <Form.Item
              label="详细描述"
              name="description"
              rules={[{ required: true, message: '请描述您的旅行需求！' }]}
              extra="请详细描述您的旅行需求，例如：喜欢的景点类型、美食偏好、住宿要求等"
            >
              <TextArea
                rows={6}
                placeholder="例如：我想去日本东京旅游5天，喜欢动漫文化和美食，预算5000元左右..."
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
              >
                生成行程
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">💡 提示</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 描述越详细，AI 生成的行程越符合您的需求</li>
              <li>• 可以包含兴趣爱好、饮食偏好、出行人数等信息</li>
              <li>• 生成后可以继续修改和调整行程</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

