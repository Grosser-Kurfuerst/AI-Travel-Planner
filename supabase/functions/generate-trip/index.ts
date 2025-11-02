// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * 调用 OpenAI 兼容的 API (Kimi/GPT-4) - 非流式
 */
async function callOpenAICompatibleAPI(apiUrl: string, apiKey: string, model: string, prompt: string): Promise<string> {
  console.log('调用 AI API (非流式模式)...')

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的旅行规划助手，擅长根据用户需求生成详细丰富的旅行计划。每个活动的描述要详细具体，至少100字。请确保返回完整的JSON格式，不要截断。'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,  // 降低 token 限制，避免超过配额
      stream: false,  // 关闭流式传输
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AI API 错误:', errorText)
    throw new Error(`AI API 调用失败: ${response.status} ${errorText}`)
  }

  // 处理普通 JSON 响应
  const responseData = await response.json()

  console.log('AI API 响应结构:', JSON.stringify(responseData).substring(0, 200))

  // 提取内容
  if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
    console.error('响应格式异常:', JSON.stringify(responseData))
    throw new Error('AI 返回的响应格式不正确')
  }

  const content = responseData.choices[0].message.content

  if (!content) {
    throw new Error('AI 未返回任何内容')
  }

  // 检查是否因为长度限制被截断
  if (responseData.choices[0].finish_reason === 'length') {
    console.warn('⚠️ 警告：响应因 token 限制被截断！')
  } else if (responseData.choices[0].finish_reason === 'stop') {
    console.log('✅ AI 响应正常结束')
  }

  console.log('AI 完整响应长度:', content.length)
  return content
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

请生成一个详细完整的旅行计划，严格按照以下 JSON 格式返回：

{
  "title": "行程标题",
  "destination": "目的地城市",
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00",
          "type": "attraction",
          "name": "景点名称",
          "description": "详细描述景点特色、游玩建议等（100字左右）",
          "location": "具体地址",
          "estimated_cost": 100
        },
        {
          "time": "12:00",
          "type": "restaurant",
          "name": "餐厅名称",
          "description": "推荐菜品、特色美食等（100字左右）",
          "location": "具体地址",
          "estimated_cost": 80
        }
      ]
    }
  ]
}

重要要求：
1. type 可选值：attraction（景点）、restaurant（餐厅）、transport（交通）、hotel（住宿）、other（其他）
2. description 要详细具体，每个100字左右，包含特色、建议、注意事项等
3. 每天至少安排 4-6 个活动，包括早中晚餐、交通、景点、住宿
4. 必须返回完整的 JSON，确保所有括号都闭合
5. 不要使用 markdown 代码块标记（不要 \`\`\`json）
6. 直接返回纯 JSON，不要任何前缀或后缀文字
7. 确保 JSON 格式正确，可以被直接解析
8. 每天的行程要丰富完整，从早到晚都有安排
9. 需要安排出发地到目的地的往返交通
`

    // 调用 AI API（支持 Kimi 和 GPT-4）
    const kimiApiKey = Deno.env.get('KIMI_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    let aiApiUrl = ''
    let aiApiKey = ''
    let aiModel = ''

    if (kimiApiKey) {
      aiApiUrl = 'https://api.moonshot.cn/v1/chat/completions'
      aiApiKey = kimiApiKey
      aiModel = 'moonshot-v1-32k'
    } else if (openaiApiKey) {
      aiApiUrl = 'https://api.openai.com/v1/chat/completions'
      aiApiKey = openaiApiKey
      aiModel = 'gpt-4'
    } else {
      throw new Error('未配置 AI API Key (需要 KIMI_API_KEY 或 OPENAI_API_KEY)')
    }

    console.log(`使用 AI 模型: ${aiModel}`)
    console.log(`Prompt 长度: ${aiPrompt.length} 字符`)

    // 调用 OpenAI 兼容的 API (Kimi/GPT-4)
    const aiContent = await callOpenAICompatibleAPI(aiApiUrl, aiApiKey, aiModel, aiPrompt)

    console.log('AI 完整响应长度:', aiContent.length)
    console.log('AI 响应前200字符:', aiContent)

    // 解析 AI 返回的 JSON
    let tripPlan
    try {
      // 尝试提取 JSON（移除可能的 markdown 代码块标记）
      let jsonStr = aiContent.trim()

      console.log('原始响应长度:', jsonStr.length)

      // 移除 markdown 代码块标记
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        console.log('移除 ```json 标记')
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
        console.log('移除 ``` 标记')
      }

      // 移除可能的前缀文字（AI 有时会添加说明）
      const jsonStart = jsonStr.indexOf('{')
      if (jsonStart > 0) {
        console.log('发现前缀文字，从位置', jsonStart, '开始提取 JSON')
        jsonStr = jsonStr.substring(jsonStart)
      }

      // 移除可能的后缀文字
      const jsonEnd = jsonStr.lastIndexOf('}')
      if (jsonEnd > 0 && jsonEnd < jsonStr.length - 1) {
        console.log('发现后缀文字，截取到位置', jsonEnd + 1)
        jsonStr = jsonStr.substring(0, jsonEnd + 1)
      }

      console.log('清理后的 JSON 长度:', jsonStr.length)
      console.log('JSON 开头:', jsonStr.substring(0, 100))
      console.log('JSON 结尾:', jsonStr.substring(Math.max(0, jsonStr.length - 100)))

      // 检查 JSON 是否完整
      const openBraces = (jsonStr.match(/{/g) || []).length
      const closeBraces = (jsonStr.match(/}/g) || []).length
      const openBrackets = (jsonStr.match(/\[/g) || []).length
      const closeBrackets = (jsonStr.match(/]/g) || []).length

      console.log('括号统计 - {}:', openBraces, '/', closeBraces, '[]:', openBrackets, '/', closeBrackets)

      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.warn('JSON 括号不匹配，尝试修复...')

        // 补全缺失的括号
        for (let i = closeBrackets; i < openBrackets; i++) {
          jsonStr += ']'
          console.log('补充缺失的 ]')
        }
        for (let i = closeBraces; i < openBraces; i++) {
          jsonStr += '}'
          console.log('补充缺失的 }')
        }
      }

      // 尝试解析
      tripPlan = JSON.parse(jsonStr)
      console.log('JSON 解析成功')

      // 验证必需字段
      if (!tripPlan.title || !tripPlan.destination || !tripPlan.days) {
        throw new Error('AI 返回的数据缺少必需字段 (title, destination, days)')
      }

      if (!Array.isArray(tripPlan.days) || tripPlan.days.length === 0) {
        throw new Error('AI 返回的行程天数为空')
      }

      console.log('行程验证通过，包含', tripPlan.days.length, '天行程')

    } catch (e) {
      console.error('解析 AI 响应失败:', e)
      console.error('原始内容长度:', aiContent.length)
      console.error('原始内容:', aiContent)

      throw new Error(`AI 返回的数据格式不正确：${e.message}。请重试或简化您的需求。`)
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

