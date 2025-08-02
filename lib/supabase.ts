import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 确保环境变量存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase环境变量，请检查.env.local文件')
}

// 单例模式：确保只有一个Supabase客户端实例
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

// 创建面向组件的客户端，只用于认证
export const createSupabaseClient = () => {
  if (!supabaseClient) {
    try {
      supabaseClient = createClientComponentClient()
    } catch (error) {
      console.error('创建Supabase客户端失败:', error)
      throw error
    }
  }
  return supabaseClient
}

// 清理函数，用于测试或特殊情况
export const clearSupabaseClient = () => {
  supabaseClient = null
}
