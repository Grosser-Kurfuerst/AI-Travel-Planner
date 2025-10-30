'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { Button, Spin } from 'antd';

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI 旅行规划助手
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            让 AI 为您规划完美的旅程
          </p>

          {!user ? (
            <div className="flex gap-4 justify-center">
              <Link href="/auth/login">
                <Button type="primary" size="large">
                  登录
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="large">
                  注册
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link href="/trips">
                <Button type="primary" size="large">
                  我的行程
                </Button>
              </Link>
              <Link href="/plan">
                <Button size="large">
                  创建新行程
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🤖 智能规划</h3>
            <p className="text-gray-600">
              基于 AI 大模型，根据您的需求智能生成个性化旅行计划
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">🗺️ 地图导航</h3>
            <p className="text-gray-600">
              集成高德地图，精准定位景点位置，规划最优路线
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">💰 预算管理</h3>
            <p className="text-gray-600">
              智能记账，语音记录开销，实时追踪旅行预算
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
