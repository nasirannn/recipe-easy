/**
 * 🛠️ 统一工具库 - 项目核心工具函数集合
 * 
 * 这个文件整合了项目中所有常用的工具函数，提供统一的导入入口。
 * 包含以下功能模块：
 * 
 * 1. 🎨 CSS样式工具 - 类名合并、样式处理
 * 2. 🆔 数据生成工具 - ID生成、用户显示名称
 * 3. 🚨 错误处理工具 - API错误处理、响应格式化
 * 4. 🌐 网络工具 - CORS处理、响应工具
 * 
 * 使用方式：
 * import { cn, generateId, handleApiError } from '@/lib/utils'
 */

// ==================== 🎨 CSS样式工具 ====================
// 智能合并CSS类名，自动去重Tailwind CSS类
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 智能CSS类名合并工具
 * 结合clsx的条件渲染和tailwind-merge的类名去重
 * 
 * @example
 * cn('text-red-500', isActive && 'bg-blue-500', 'p-4')
 * // 输出: 'text-red-500 bg-blue-500 p-4' (当isActive为true时)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==================== 🆔 数据生成工具 ====================
// 生成唯一ID和用户显示名称
export * from './id-generator';
export * from './user-display';



// ==================== 🌐 网络工具 ====================
// CORS处理、API响应工具
export * from './cors';
export * from './response-helpers';
export * from './image-utils';
export * from './database-utils';
export * from './data-transform';
export * from './validation';
 