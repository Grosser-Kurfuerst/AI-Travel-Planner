'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, message, Card, DatePicker, Space, Tooltip, Tag } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/hooks/useUser';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseVoiceInput, applyParsedInfoToForm } from '@/lib/voiceParser';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function PlanPage() {
  const [loading, setLoading] = useState(false);
  const [parsedFields, setParsedFields] = useState<string[]>([]); // 记录自动识别的字段
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [form] = Form.useForm();

  // 语音识别
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();

  // 当语音识别有新内容时，解析并更新表单
  useEffect(() => {
    if (transcript) {
      // 解析语音内容
      const parsedInfo = parseVoiceInput(transcript);

      // 应用到表单
      const updatedFields = applyParsedInfoToForm(parsedInfo, form, dayjs);

      // 记录哪些字段被自动识别了
      const newParsedFields: string[] = [];
      if (updatedFields.destination) newParsedFields.push('目的地');
      if (updatedFields.dateRange) newParsedFields.push('出行日期');
      if (updatedFields.budget) newParsedFields.push('预算');

      if (newParsedFields.length > 0) {
        setParsedFields(newParsedFields);
        message.success(`已自动识别：${newParsedFields.join('、')}`);
      }

      resetTranscript();
    }
  }, [transcript, form, resetTranscript]);

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
        {userLoading ? (
          <div className="flex justify-center items-center py-20">
            <div>加载中...</div>
          </div>
        ) : !user ? (
          <Card>
            <div className="text-center py-8">
              <p className="mb-4">请先登录后再创建行程</p>
              <Button type="primary" onClick={() => router.push('/auth/login')}>
                前往登录
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h1 className="text-3xl font-bold mb-6">创建新行程</h1>

            <Form
              name="plan"
              form={form}
              onFinish={onFinish}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                label={
                  <Space>
                    <span>目的地</span>
                    {parsedFields.includes('目的地') && (
                      <Tag color="green" style={{ fontSize: '10px' }}>语音识别</Tag>
                    )}
                  </Space>
                }
                name="destination"
                rules={[{ required: true, message: '请输入目的地！' }]}
              >
                <Input size="large" placeholder="例如：日本东京" />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <span>出行日期</span>
                    {parsedFields.includes('出行日期') && (
                      <Tag color="green" style={{ fontSize: '10px' }}>语音识别</Tag>
                    )}
                  </Space>
                }
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
                label={
                  <Space>
                    <span>预算（元）</span>
                    {parsedFields.includes('预算') && (
                      <Tag color="green" style={{ fontSize: '10px' }}>语音识别</Tag>
                    )}
                  </Space>
                }
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
                label={
                  <Space>
                    <span>详细描述</span>
                    {isSupported && (
                      <Tooltip title={isListening ? '点击停止录音' : '点击开始语音输入'}>
                        <Button
                          type={isListening ? 'primary' : 'default'}
                          icon={isListening ? <AudioMutedOutlined /> : <AudioOutlined />}
                          onClick={() => {
                            if (isListening) {
                              stopListening();
                              message.success('语音输入已停止');
                            } else {
                              startListening();
                              message.info('开始语音输入，请说话...');
                            }
                          }}
                          danger={isListening}
                          size="small"
                        >
                          {isListening ? '停止录音' : '语音输入'}
                        </Button>
                      </Tooltip>
                    )}
                  </Space>
                }
                name="description"
                rules={[{ required: true, message: '请描述您的旅行需求！' }]}
                extra={
                  <div>
                    {speechError && (
                      <div className="text-red-500 text-sm mb-2">
                        ⚠️ {speechError}
                      </div>
                    )}
                    {isListening && (
                      <div className="text-blue-600 text-sm mb-2">
                        🎤 正在录音中...
                      </div>
                    )}
                    {!isSupported && (
                      <div className="text-orange-500 text-sm mb-2">
                        ℹ️ 您的浏览器不支持语音输入，建议使用 Chrome 或 Edge 浏览器
                      </div>
                    )}
                    {parsedFields.length > 0 && (
                      <div className="text-green-600 text-sm mb-2">
                        ✅ 已自动识别：{parsedFields.join('、')}
                      </div>
                    )}
                    <div className="text-gray-500 text-sm">
                      <div className="mb-1">💡 语音输入示例：</div>
                      <div className="pl-4">
                        "去北京旅游，11月15日到20日，预算5000元，喜欢历史与传统"
                      </div>
                      <div className="mt-2">
                        系统会自动识别目的地、日期、预算等信息并填入对应字段
                      </div>
                    </div>
                  </div>
                }
              >
                <TextArea
                  rows={6}
                  placeholder="例如：去北京旅游，11月15日到20日，预算5000元，喜欢历史与传统（支持语音输入）"
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
                <li>• 支持语音输入，点击"语音输入"按钮即可开始说话</li>
                <li>• 生成后可以继续修改和调整行程</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

