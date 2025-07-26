import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 确保环境变量存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase环境变量，请检查.env.local文件')
}

// 创建通用的Supabase客户端，只用于认证
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// 创建面向组件的客户端，只用于认证
export const createSupabaseClient = () => {
  try {
    return createClientComponentClient()
  } catch (error) {
    console.error('创建Supabase客户端失败:', error)
    throw error
  }
}
