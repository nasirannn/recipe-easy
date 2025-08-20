/**
 * 数据库工具
 * 处理数据库查询、配置获取等操作
 */

import { D1Database } from '@cloudflare/workers-types';

/**
 * 获取 D1 数据库实例
 * 支持 Cloudflare Workers 和本地开发环境
 */
export function getD1Database(): D1Database | null {
  try {
    // 首先尝试 Cloudflare Workers 环境
    const cfContext = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    if (cfContext?.env?.RECIPE_EASY_DB) {
      return cfContext.env.RECIPE_EASY_DB;
    }

    // 然后尝试 Next.js API 路由环境
    if (typeof globalThis !== 'undefined' && (globalThis as any).__NEXT_DATA__) {
      // 在 Next.js 环境中，我们可能需要通过其他方式访问数据库
      // 这里返回 null，让调用者知道需要处理本地开发环境
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error getting D1 database:', error);
    return null;
  }
}

/**
 * 获取 R2 存储桶实例
 * 支持 Cloudflare Workers 和本地开发环境
 */
export function getR2Bucket(): any | null {
  try {
    // 首先尝试 Cloudflare Workers 环境
    const cfContext = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    if (cfContext?.env?.RECIPE_IMAGES) {
      return cfContext.env.RECIPE_IMAGES;
    }

    // 在本地开发环境中，R2 不可用
    return null;
  } catch (error) {
    console.error('Error getting R2 bucket:', error);
    return null;
  }
}

/**
 * 检查是否在 Cloudflare Workers 环境中
 */
export function isCloudflareWorkers(): boolean {
  try {
    const cfContext = (globalThis as any)[Symbol.for('__cloudflare-context__')];
    const hasDb = !!cfContext?.env?.RECIPE_EASY_DB;
    
    // 额外检查：确保我们真的在 Cloudflare Workers 环境中
    // 在本地开发环境中，即使有 cfContext，也不应该有真实的 D1 数据库
    if (hasDb && process.env.NODE_ENV === 'development') {
      // 在开发环境中，即使检测到 cfContext，我们也应该使用 Worker API
      return false;
    }
    
    return hasDb;
  } catch (error) {
    return false;
  }
}

/**
 * 获取系统配置
 */
export async function getSystemConfig(
  db: D1Database, 
  key: string, 
  defaultValue: string | number | boolean
): Promise<any> {
  try {
    const result = await db.prepare(`
      SELECT value FROM system_configs WHERE key = ?
    `).bind(key).first();
    
    if (!result || !result.value) {
      return defaultValue;
    }
    
    const value = String(result.value);
    
    // 根据默认值类型转换返回值
    if (typeof defaultValue === 'number') {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? defaultValue : numValue;
    } else if (typeof defaultValue === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting system config ${key}:`, error);
    return defaultValue;
  }
}

/**
 * 检查表是否存在
 */
export async function tableExists(
  db: D1Database, 
  tableName: string
): Promise<boolean> {
  try {
    const result = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name=?
    `).bind(tableName).first();
    return !!result;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

/**
 * 获取表结构
 */
export async function getTableStructure(
  db: D1Database, 
  tableName: string
): Promise<any[]> {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return result.results || [];
  } catch (error) {
    console.error(`Error getting table structure for ${tableName}:`, error);
    return [];
  }
}

/**
 * 检查列是否存在
 */
export async function columnExists(
  db: D1Database, 
  tableName: string, 
  columnName: string
): Promise<boolean> {
  try {
    const columns = await getTableStructure(db, tableName);
    return columns.some((col: any) => col.name === columnName);
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error);
    return false;
  }
}

/**
 * 添加列到表
 */
export async function addColumnToTable(
  db: D1Database, 
  tableName: string, 
  columnName: string, 
  columnType: string
): Promise<boolean> {
  try {
    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    await db.prepare(sql).run();
    return true;
  } catch (error) {
    console.error(`Error adding column ${columnName} to ${tableName}:`, error);
    return false;
  }
}

/**
 * 获取菜谱图片映射
 */
export async function getRecipeImageMap(
  db: D1Database,
  recipeIds: string[],
  baseUrl: string
): Promise<Record<string, string>> {
  if (recipeIds.length === 0) {
    return {};
  }

  try {
    const imageResults = await db.prepare(`
      SELECT r.id as recipe_id, ri.image_path
      FROM recipes r
      LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
      WHERE r.id IN (${recipeIds.map(() => '?').join(',')})
    `).bind(...recipeIds).all();
    
    const imageMap: Record<string, string> = {};
    imageResults.results.forEach((img: any) => {
      if (img.image_path) {
        imageMap[img.recipe_id] = `${baseUrl}/images/${img.image_path}`;
      }
    });
    
    return imageMap;
  } catch (error) {
    console.error('Error getting recipe image map:', error);
    return {};
  }
}

/**
 * 构建国际化SQL查询
 */
export function buildI18nQuery(
  baseTable: string,
  i18nTable: string,
  language: string,
  fields: string[]
): string {
  const i18nFields = fields.map(field => 
    `COALESCE(${i18nTable}.${field}, ${baseTable}.${field}) as localized_${field}`
  ).join(', ');
  
  return i18nFields;
}

/**
 * 构建搜索条件
 */
export function buildSearchCondition(
  search: string,
  fields: string[],
  hasI18n: boolean = false,
  i18nTable?: string,
  baseTable?: string
): { condition: string; params: string[] } {
  if (!search) {
    return { condition: '', params: [] };
  }

  const params: string[] = [];
  const conditions: string[] = [];

  fields.forEach(field => {
    if (hasI18n && i18nTable && baseTable) {
      conditions.push(`(COALESCE(${i18nTable}.${field}, ${baseTable}.${field}) LIKE ?)`);
    } else {
      conditions.push(`(${field} LIKE ?)`);
    }
    params.push(`%${search}%`);
  });

  return {
    condition: conditions.join(' OR '),
    params
  };
}

/**
 * 构建分页查询
 */
export function buildPaginationQuery(
  baseQuery: string,
  limit: number,
  offset: number
): string {
  return `${baseQuery} LIMIT ? OFFSET ?`;
}

/**
 * 执行分页查询
 */
export async function executePaginationQuery<T>(
  db: D1Database,
  sql: string,
  params: any[],
  limit: number,
  offset: number
): Promise<{ results: T[]; total: number }> {
  try {
    // 执行主查询
    const result = await db.prepare(sql).bind(...params, limit, offset).all();
    
    // 构建计数查询
    const countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM')
                       .replace(/ORDER BY.*$/, '')
                       .replace(/LIMIT.*$/, '');
    
    const countResult = await db.prepare(countSql).bind(...params).first();
    
    return {
      results: (result.results || []) as T[],
      total: (countResult?.total as number) || 0
    };
  } catch (error) {
    console.error('Error executing pagination query:', error);
    return { results: [], total: 0 };
  }
} 