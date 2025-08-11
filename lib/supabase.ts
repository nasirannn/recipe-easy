import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 检查是否在 Cloudflare Workers 环境中
const isWorkerEnvironment = typeof globalThis !== 'undefined' && 'Cloudflare' in globalThis;

// 只在非 Worker 环境中访问 process.env
let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;

if (!isWorkerEnvironment) {
  try {
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // 确保环境变量存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('缺少Supabase环境变量，请检查.env.local文件');
    }
  } catch (error) {
    console.warn('无法访问环境变量，可能是在 Worker 环境中');
  }
}

// 单例模式：确保只有一个Supabase客户端实例
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

// 创建面向组件的客户端，只用于认证
export const createSupabaseClient = () => {
  // 在 Worker 环境中返回 null
  if (isWorkerEnvironment) {
    console.warn('Supabase 客户端在 Worker 环境中不可用');
    return null as any;
  }
  
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
