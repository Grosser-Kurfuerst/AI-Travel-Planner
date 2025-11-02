// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { tripId } = await req.json()

    if (!tripId) {
      throw new Error('未提供行程ID')
    }

    console.log('删除行程:', tripId, '用户:', user.id)

    // 验证行程是否属于当前用户
    const { data: trip, error: fetchError } = await supabaseClient
      .from('trips')
      .select('id, user_id')
      .eq('id', tripId)
      .single()

    if (fetchError) {
      console.error('查询行程失败:', fetchError)
      throw new Error('行程不存在')
    }

    if (trip.user_id !== user.id) {
      throw new Error('无权删除此行程')
    }

    // 删除关联的活动（由于外键约束，会自动级联删除）
    // 但为了记录日志，我们先手动删除
    const { error: deleteActivitiesError } = await supabaseClient
      .from('activities')
      .delete()
      .eq('trip_id', tripId)

    if (deleteActivitiesError) {
      console.error('删除活动失败:', deleteActivitiesError)
      // 继续尝试删除行程
    } else {
      console.log('成功删除行程的所有活动')
    }

    // 删除行程
    const { error: deleteTripError } = await supabaseClient
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (deleteTripError) {
      console.error('删除行程失败:', deleteTripError)
      throw new Error('删除行程失败：' + deleteTripError.message)
    }

    console.log('成功删除行程:', tripId)

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '行程删除成功',
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

