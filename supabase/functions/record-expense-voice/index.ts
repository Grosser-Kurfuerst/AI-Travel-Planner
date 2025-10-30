import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpenseRequest {
  tripId: string
  audio_base64: string
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 获取用户认证信息
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('未提供认证信息')
    }

    // 创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // 验证用户身份
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('用户认证失败')
    }

    // 解析请求体
    const requestData: ExpenseRequest = await req.json()

    // 验证用户对行程的所有权
    const { data: trip, error: tripError } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', requestData.tripId)
      .single()

    if (tripError || !trip) {
      throw new Error('行程不存在或无权访问')
    }

    if (trip.user_id !== user.id) {
      throw new Error('无权访问此行程')
    }

    // 步骤1：调用语音识别 API（科大讯飞）
    // TODO: 实现科大讯飞语音识别
    // 这里使用模拟数据
    const recognizedText = '打车花了50块钱'
    // const recognizedText = await recognizeSpeech(requestData.audio_base64)

    // 步骤2：使用 AI 解析语音文本，提取费用信息
    const aiApiKey = Deno.env.get('KIMI_API_KEY') || Deno.env.get('OPENAI_API_KEY')
    if (!aiApiKey) {
      throw new Error('未配置 AI API Key')
    }

    const aiPrompt = `
请从以下文本中提取费用信息，并以 JSON 格式返回：

文本："${recognizedText}"

返回格式：
{
  "amount": 数字（费用金额）,
  "category": "字符串（费用分类，如：交通、餐饮、住宿、门票、购物、其他）",
  "description": "字符串（费用描述）"
}

如果无法识别有效的费用信息，返回 null。
`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个费用信息提取助手，擅长从自然语言中提取金额、类别等结构化信息。',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      throw new Error('AI API 调用失败')
    }

    const aiData = await aiResponse.json()
    const aiContent = aiData.choices[0].message.content

    // 解析 AI 返回的 JSON
    let expenseData
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        expenseData = JSON.parse(jsonMatch[0])
      } else {
        expenseData = JSON.parse(aiContent)
      }
    } catch (e) {
      console.error('解析 AI 响应失败:', e)
      throw new Error('无法识别有效的费用信息')
    }

    if (!expenseData || !expenseData.amount) {
      throw new Error('无法识别有效的费用信息')
    }

    // 步骤3：将费用记录保存到数据库
    const { data: expense, error: expenseError } = await supabaseClient
      .from('expenses')
      .insert({
        trip_id: requestData.tripId,
        user_id: user.id,
        amount: expenseData.amount,
        category: expenseData.category || '其他',
        description: expenseData.description || recognizedText,
        expense_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (expenseError) {
      console.error('创建费用记录失败:', expenseError)
      throw new Error('创建费用记录失败：' + expenseError.message)
    }

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        expense: expense,
        recognizedText: recognizedText,
        message: '费用记录成功',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

