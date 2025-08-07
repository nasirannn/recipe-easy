// 统一导出所有类型定义
export * from './recipe';
export * from './database';
export * from './image';
// 从 config 中导入类型定义，避免重复
export type { Difficulty } from '@/lib/config'; 