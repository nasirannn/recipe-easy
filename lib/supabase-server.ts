import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 创建服务器端的Supabase客户端
export function createSupabaseServerClient() {
  try {
    return createServerComponentClient({ cookies });
  } catch (error) {
    console.error('创建服务器端Supabase客户端失败:', error);
    throw error;
  }
}

// 创建API路由使用的Supabase客户端（不需要cookies对象）
export function createSupabaseServerRouteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('缺少Supabase环境变量，请检查.env文件');
  }
  
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} 