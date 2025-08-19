import { createClient } from '@supabase/supabase-js'

// 延迟初始化，避免构建时执行
let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase 环境变量未配置');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// 为了兼容性，保留原来的导出
export const supabase = getSupabase();
