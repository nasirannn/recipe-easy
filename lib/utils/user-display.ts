import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '../supabase'

/**
 * 获取用户友好的显示名称
 * 优先级：Supabase display_name > Google full_name > 邮箱前缀美化 > 默认名称
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Guest'
  
  // 1. 优先使用Supabase的display_name字段
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name
  }
  
  // 2. 使用Google OAuth的full_name
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  
  // 3. 尝试使用name字段
  if (user.user_metadata?.name) {
    return user.user_metadata.name
  }
  
  // 4. 美化邮箱前缀
  if (user.email) {
    return beautifyEmailPrefix(user.email)
  }
  
  // 5. 默认名称
  return 'User'
}

/**
 * 更新用户显示名称到Supabase
 */
export async function updateUserDisplayName(user: User | null, displayName: string): Promise<boolean> {
  if (!user) return false
  
  try {
    const supabase = createSupabaseClient()
    

    
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName
      }
    })
    
    if (error) {
      console.error('Failed to update display name:', error)
      return false
    }
    
    
    
    return true
  } catch (error) {
    console.error('Error updating display name:', error)
    return false
  }
}

/**
 * 获取建议的显示名称（用于编辑对话框的回显）
 * 优先返回当前的display_name，如果没有则返回美化后的邮箱前缀
 */
export function getSuggestedDisplayName(user: User | null): string {
  if (!user) return ''
  
  // 优先返回当前的display_name（用户自定义的名称）
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name
  }
  
  // 如果没有自定义名称，返回美化后的邮箱前缀
  if (user.email) {
    return beautifyEmailPrefix(user.email)
  }
  
  return 'User'
}

/**
 * 美化邮箱前缀，使其更友好
 */
function beautifyEmailPrefix(email: string): string {
  const prefix = email.split('@')[0]
  
  // 如果前缀看起来像用户名（包含数字、下划线等），进行美化
  if (isUsernameLike(prefix)) {
    return beautifyUsername(prefix)
  }
  
  // 如果前缀看起来像真实姓名，直接使用
  return capitalizeFirstLetter(prefix)
}

/**
 * 判断前缀是否像用户名（包含数字、下划线、点等）
 */
function isUsernameLike(prefix: string): boolean {
  const usernamePatterns = [
    /\d/,           // 包含数字
    /[._-]/,        // 包含下划线、点、连字符
    /^[a-z]+$/,     // 全小写字母
    /^[A-Z]+$/,     // 全大写字母
    /^[a-zA-Z0-9._-]+$/, // 典型的用户名格式
  ]
  
  return usernamePatterns.some(pattern => pattern.test(prefix))
}

/**
 * 美化用户名
 */
function beautifyUsername(username: string): string {
  // 移除常见的用户名后缀
  const cleanUsername = username
    .replace(/[._-]/g, ' ')  // 将下划线、点、连字符替换为空格
    .replace(/\d+$/, '')     // 移除末尾的数字
    .trim()
  
  // 如果清理后为空，使用原始用户名
  if (!cleanUsername) {
    return capitalizeFirstLetter(username)
  }
  
  // 首字母大写
  return capitalizeFirstLetter(cleanUsername)
}

/**
 * 首字母大写
 */
function capitalizeFirstLetter(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 获取用户头像URL
 */
export function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null
  
  // 添加调试信息
  console.log('🔍 getUserAvatarUrl - User metadata:', {
    user_id: user.id,
    provider: user.app_metadata?.provider,
    user_metadata: user.user_metadata,
    avatar_url: user.user_metadata?.avatar_url,
    picture: user.user_metadata?.picture,
    image: user.user_metadata?.image,
    photo: user.user_metadata?.photo
  });
  
  // 扩展头像URL获取逻辑，支持更多可能的字段名
  // Google OAuth可能使用的字段：picture, avatar_url, image, photo
  const avatarUrl = user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture || 
                   user.user_metadata?.image ||
                   user.user_metadata?.photo ||
                   null;
  
  console.log('🔍 getUserAvatarUrl - Final avatar URL:', avatarUrl);
  
  // 如果没有找到头像URL，尝试生成备用头像
  if (!avatarUrl && user.email) {
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName(user))}&background=0f172a&color=fff&size=150`;
    console.log('🔍 getUserAvatarUrl - Using fallback avatar URL:', fallbackUrl);
    return fallbackUrl;
  }
  
  return avatarUrl;
}

/**
 * 判断用户是否使用Google登录
 */
export function isGoogleUser(user: User | null): boolean {
  if (!user) return false
  return user.app_metadata?.provider === 'google'
}

/**
 * 判断用户是否使用邮箱登录
 */
export function isEmailUser(user: User | null): boolean {
  if (!user) return false
  return user.app_metadata?.provider === 'email'
} 