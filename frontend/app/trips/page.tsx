'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, List, Tag, Spin, Empty, message, Popconfirm } from 'antd';
import { PlusOutlined, CalendarOutlined, EnvironmentOutlined, DollarOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase, Trip } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';
import dayjs from 'dayjs';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // 等待用户状态加载完成
    if (userLoading) return;

    // 如果没有用户，跳转到登录页
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadTrips();

    // 订阅实时更新
    const channel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userLoading, router]);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrips(data || []);
    } catch (error: any) {
      message.error('加载行程失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string, tripTitle: string) => {
    setDeleting(tripId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        message.error('请先登录');
        return;
      }

      // 调用 Edge Function 删除行程
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-trip`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tripId }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }

      message.success(`行程"${tripTitle}"已删除`);

      // 刷新列表
      loadTrips();
    } catch (error: any) {
      message.error('删除行程失败：' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'blue';
      case 'ongoing':
        return 'green';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return '规划中';
      case 'ongoing':
        return '进行中';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">我的行程</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => router.push('/plan')}
          >
            创建新行程
          </Button>
        </div>

        {trips.length === 0 ? (
          <Card>
            <Empty
              description="还没有行程，开始创建您的第一个旅行计划吧！"
            >
              <Button type="primary" onClick={() => router.push('/plan')}>
                创建行程
              </Button>
            </Empty>
          </Card>
        ) : (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
            dataSource={trips}
            renderItem={(trip) => (
            <List.Item>
              <Card
                hoverable
                className="h-full"
                actions={[
                  <Button
                    key="view"
                    type="link"
                    onClick={() => router.push(`/trips/${trip.id}`)}
                  >
                    查看详情
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确认删除"
                    description={`确定要删除行程"${trip.title}"吗？此操作无法撤销。`}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDeleteTrip(trip.id, trip.title);
                    }}
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deleting === trip.id}
                      onClick={(e) => e.stopPropagation()}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{trip.title}</h3>
                    <Tag color={getStatusColor(trip.status)}>
                      {getStatusText(trip.status)}
                    </Tag>
                  </div>
                </div>

                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center">
                    <EnvironmentOutlined className="mr-2" />
                    <span>{trip.destination}</span>
                  </div>
                    <div className="flex items-center">
                      <CalendarOutlined className="mr-2" />
                      <span>
                        {dayjs(trip.start_date).format('YYYY-MM-DD')} 至{' '}
                        {dayjs(trip.end_date).format('YYYY-MM-DD')}
                      </span>
                    </div>
                    {trip.budget && (
                      <div className="flex items-center">
                        <DollarOutlined className="mr-2" />
                        <span>预算：¥{trip.budget}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}

