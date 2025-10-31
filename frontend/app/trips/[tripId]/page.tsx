'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Timeline, Tag, Spin, message, Tabs, Modal, Form, Input, Select } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase, Trip, Activity, Expense } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';
import AMapLoader from '@amap/amap-jsapi-loader';
import dayjs from 'dayjs';

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expenseForm] = Form.useForm();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 等待用户状态加载完成
    if (userLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadTripData();
  }, [user, userLoading, tripId, router]);

  useEffect(() => {
    if (activities.length > 0 && mapContainerRef.current) {
      initMap();
    }
  }, [activities]);

  const loadTripData = async () => {
    try {
      // 加载行程基本信息
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setTrip(tripData);

      // 加载活动
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true });

      if (activitiesError) throw activitiesError;
      setActivities(activitiesData || []);

      // 加载费用
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);
    } catch (error: any) {
      message.error('加载行程失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const initMap = async () => {
    try {
      const AMap = await AMapLoader.load({
        key: process.env.NEXT_PUBLIC_AMAP_KEY || '',
        version: '2.0',
        plugins: ['AMap.Marker'],
      });

      if (mapRef.current) {
        mapRef.current.destroy();
      }

      const map = new AMap.Map(mapContainerRef.current, {
        zoom: 12,
        center: [116.397428, 39.90923], // 默认中心点
      });

      // 添加标记点
      const markers: any[] = [];
      activities.forEach((activity, index) => {
        if (activity.longitude && activity.latitude) {
          const marker = new AMap.Marker({
            position: [activity.longitude, activity.latitude],
            title: activity.name,
            label: {
              content: `${index + 1}`,
              direction: 'top',
            },
          });
          markers.push(marker);
          map.add(marker);
        }
      });

      // 自动调整视野
      if (markers.length > 0) {
        map.setFitView(markers);
      }

      mapRef.current = map;
    } catch (error) {
      console.error('地图加载失败:', error);
    }
  };

  const handleAddExpense = async (values: any) => {
    try {
      const { error } = await supabase.from('expenses').insert({
        trip_id: tripId,
        user_id: user?.id,
        amount: parseFloat(values.amount),
        category: values.category,
        description: values.description,
        expense_date: new Date().toISOString(),
      });

      if (error) throw error;

      message.success('费用记录成功！');
      setExpenseModalVisible(false);
      expenseForm.resetFields();
      loadTripData();
    } catch (error: any) {
      message.error('记录费用失败：' + error.message);
    }
  };

  const groupActivitiesByDay = () => {
    const grouped: { [key: number]: Activity[] } = {};
    activities.forEach((activity) => {
      if (!grouped[activity.day_number]) {
        grouped[activity.day_number] = [];
      }
      grouped[activity.day_number].push(activity);
    });
    return grouped;
  };

  const getTotalExpense = () => {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  };

  const getActivityTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      attraction: '景点',
      restaurant: '餐饮',
      transport: '交通',
      hotel: '住宿',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const getActivityTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      attraction: 'blue',
      restaurant: 'orange',
      transport: 'green',
      hotel: 'purple',
      other: 'default',
    };
    return colorMap[type] || 'default';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!trip) {
    return <div className="min-h-screen flex items-center justify-center">行程不存在</div>;
  }

  const activityGroups = groupActivitiesByDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <Card className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
              <div className="flex gap-4 text-gray-600">
                <span>
                  <EnvironmentOutlined className="mr-1" />
                  {trip.destination}
                </span>
                <span>
                  <ClockCircleOutlined className="mr-1" />
                  {dayjs(trip.start_date).format('YYYY-MM-DD')} 至{' '}
                  {dayjs(trip.end_date).format('YYYY-MM-DD')}
                </span>
                {trip.budget && (
                  <span>
                    <DollarOutlined className="mr-1" />
                    预算：¥{trip.budget}
                  </span>
                )}
              </div>
            </div>
            <Button type="primary" onClick={() => setExpenseModalVisible(true)}>
              记录费用
            </Button>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card title="行程安排">
              {Object.keys(activityGroups).length === 0 ? (
                <div className="text-center text-gray-500 py-8">暂无活动安排</div>
              ) : (
                Object.entries(activityGroups).map(([day, dayActivities]) => (
                  <div key={day} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">第 {day} 天</h3>
                    <Timeline>
                      {dayActivities.map((activity) => (
                        <Timeline.Item key={activity.id}>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{activity.start_time}</span>
                              <Tag color={getActivityTypeColor(activity.type)}>
                                {getActivityTypeText(activity.type)}
                              </Tag>
                              <span className="font-medium">{activity.name}</span>
                            </div>
                            {activity.description && (
                              <p className="text-gray-600">{activity.description}</p>
                            )}
                            {activity.location_name && (
                              <span className="text-sm text-gray-500">
                                <EnvironmentOutlined className="mr-1" />
                                {activity.location_name}
                              </span>
                            )}
                            {activity.estimated_cost && (
                              <span className="text-sm text-gray-500">
                                预计费用：¥{activity.estimated_cost}
                              </span>
                            )}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                ))
              )}
            </Card>

            <Card title="地图" className="mt-6">
              <div ref={mapContainerRef} style={{ width: '100%', height: '400px' }} />
            </Card>
          </div>

          <div>
            <Card title="费用统计">
              <div className="mb-4">
                <div className="text-2xl font-bold text-blue-600">
                  ¥{getTotalExpense().toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">总支出</div>
                {trip.budget && (
                  <div className="mt-2 text-sm">
                    预算剩余：¥{(trip.budget - getTotalExpense()).toFixed(2)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">暂无费用记录</div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500">{expense.description}</div>
                        )}
                      </div>
                      <div className="text-red-600 font-semibold">
                        -¥{Number(expense.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        title="记录费用"
        open={expenseModalVisible}
        onCancel={() => {
          setExpenseModalVisible(false);
          expenseForm.resetFields();
        }}
        footer={null}
      >
        <Form form={expenseForm} onFinish={handleAddExpense} layout="vertical">
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <Input type="number" prefix="¥" placeholder="0.00" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Select.Option value="交通">交通</Select.Option>
              <Select.Option value="住宿">住宿</Select.Option>
              <Select.Option value="餐饮">餐饮</Select.Option>
              <Select.Option value="门票">门票</Select.Option>
              <Select.Option value="购物">购物</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息（可选）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

