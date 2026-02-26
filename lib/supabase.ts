import { createClient } from '@supabase/supabase-js'

// 延迟初始化，避免构建时执行
let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    const isBrowser = typeof window !== 'undefined';
    const supabaseUrl = isBrowser
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = isBrowser
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase 环境变量未配置，请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// 创建一个代理对象，延迟初始化
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
