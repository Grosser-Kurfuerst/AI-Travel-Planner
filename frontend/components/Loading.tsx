'use client';

import { Spin } from 'antd';

interface LoadingProps {
  tip?: string;
  fullscreen?: boolean;
}

export default function Loading({ tip = '加载中...', fullscreen = true }: LoadingProps) {
  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-600">{tip}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Spin size="large" tip={tip} />
    </div>
  );
}

