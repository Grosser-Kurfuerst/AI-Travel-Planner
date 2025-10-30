import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TripRequest {
  inputType: 'text' | 'voice'
  content: string
  destination?: string
  dateRange?: [string, string]
  budget?: number
  audio_base64?: string
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
    const requestData: TripRequest = await req.json()
    let userInput = requestData.content

    // 步骤1：如果是语音输入，调用语音识别 API（这里需要您配置科大讯飞 API）
    if (requestData.inputType === 'voice' && requestData.audio_base64) {
      // TODO: 调用科大讯飞语音识别 API
      // userInput = await recognizeSpeech(requestData.audio_base64)
      console.log('语音识别功能待实现')
    }

    // 步骤2：构建 Prompt 并调用 AI 模型
    const aiPrompt = `
你是一个专业的旅行规划助手。请根据用户的需求生成详细的旅行计划。

用户需求：
${userInput}

${requestData.destination ? `目的地：${requestData.destination}` : ''}
${requestData.dateRange ? `日期：${requestData.dateRange[0]} 至 ${requestData.dateRange[1]}` : ''}
${requestData.budget ? `预算：${requestData.budget} 元` : ''}

请生成一个详细的旅行计划，以 JSON 格式返回，格式如下：
{
  "title": "行程标题",
  "destination": "目的地",
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00",
          "type": "attraction",
          "name": "景点名称",
          "description": "详细描述",
          "location": "具体地址",
          "estimated_cost": 100
        }
      ]
    }
  ]
}

type 可选值：attraction（景点）、restaurant（餐厅）、transport（交通）、hotel（住宿）、other（其他）
`

    // 调用 AI API（这里使用 Kimi/GPT-4，需要您配置 API Key）
    const aiApiKey = Deno.env.get('KIMI_API_KEY') || Deno.env.get('OPENAI_API_KEY')
    if (!aiApiKey) {
      throw new Error('未配置 AI API Key')
    }

    // 这里是一个示例，您需要根据实际使用的 AI 服务调整
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
            content: '你是一个专业的旅行规划助手，擅长根据用户需求生成详细的旅行计划。',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      throw new Error('AI API 调用失败')
    }

    const aiData = await aiResponse.json()
    const aiContent = aiData.choices[0].message.content

    // 解析 AI 返回的 JSON
    let tripPlan
    try {
      // 尝试提取 JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        tripPlan = JSON.parse(jsonMatch[0])
      } else {
        tripPlan = JSON.parse(aiContent)
      }
    } catch (e) {
      console.error('解析 AI 响应失败:', e)
      throw new Error('AI 返回的数据格式不正确')
    }

    // 步骤3：调用高德地图 API 获取地理位置信息
    const amapKey = Deno.env.get('AMAP_KEY')
    if (amapKey) {
      for (const day of tripPlan.days) {
        for (const activity of day.activities) {
          if (activity.location) {
            try {
              const geoResponse = await fetch(
                `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(
                  activity.location
                )}&city=${encodeURIComponent(tripPlan.destination)}&key=${amapKey}`
              )
              const geoData = await geoResponse.json()
              if (geoData.status === '1' && geoData.geocodes.length > 0) {
                const location = geoData.geocodes[0].location.split(',')
                activity.longitude = parseFloat(location[0])
                activity.latitude = parseFloat(location[1])
              }
            } catch (e) {
              console.error('获取地理位置失败:', e)
            }
          }
        }
      }
    }

    // 步骤4：将数据保存到数据库
    // 计算日期范围
    const startDate = requestData.dateRange?.[0] || new Date().toISOString().split('T')[0]
    const endDate =
      requestData.dateRange?.[1] ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 创建 trip 记录
    const { data: trip, error: tripError } = await supabaseClient
      .from('trips')
      .insert({
        user_id: user.id,
        title: tripPlan.title,
        destination: tripPlan.destination,
        start_date: startDate,
        end_date: endDate,
        budget: requestData.budget || null,
        status: 'planning',
      })
      .select()
      .single()

    if (tripError) {
      console.error('创建行程失败:', tripError)
      throw new Error('创建行程失败：' + tripError.message)
    }

    // 创建 activities 记录
    const activities = []
    for (const day of tripPlan.days) {
      for (const activity of day.activities) {
        activities.push({
          trip_id: trip.id,
          day_number: day.day,
          start_time: activity.time,
          type: activity.type,
          name: activity.name,
          description: activity.description || null,
          location_name: activity.location || null,
          latitude: activity.latitude || null,
          longitude: activity.longitude || null,
          estimated_cost: activity.estimated_cost || null,
        })
      }
    }

    if (activities.length > 0) {
      const { error: activitiesError } = await supabaseClient
        .from('activities')
        .insert(activities)

      if (activitiesError) {
        console.error('创建活动失败:', activitiesError)
        // 不抛出错误，因为行程已经创建成功
      }
    }

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        tripId: trip.id,
        message: '行程生成成功',
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

