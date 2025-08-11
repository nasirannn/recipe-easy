/**
 * ID生成选项接口
 */
export interface IdGenerationOptions {
  prefix?: string;
  length?: number;
  includeTimestamp?: boolean;
  separator?: string;
}

/**
 * 默认ID生成选项
 */
const DEFAULT_OPTIONS: IdGenerationOptions = {
  prefix: '',
  length: 8,
  includeTimestamp: true,
  separator: '-'
};

/**
 * 生成安全的随机字符串
 * @param length 字符串长度
 * @param charset 字符集
 * @returns 随机字符串
 */
export function generateRandomString(
  length: number, 
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  let result = '';
  const charsetLength = charset.length;
  
  // 使用 crypto.getRandomValues 生成更安全的随机数
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charsetLength];
    }
  } else {
    // Fallback 到 Math.random（不推荐用于生产环境）
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charsetLength)];
    }
  }
  
  return result;
}

/**
 * 生成 Nano ID（类似 nanoid 库的简化实现）
 * @param length ID长度
 * @param options 生成选项
 * @returns Nano ID字符串
 */
export function generateNanoId(
  length: number = 8, 
  options: IdGenerationOptions = {}
): string {
  const { prefix, includeTimestamp, separator } = { ...DEFAULT_OPTIONS, ...options };
  
  let id = generateRandomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  
  if (prefix) {
    id = prefix + separator + id;
  }
  
  if (includeTimestamp) {
    const timestamp = Date.now().toString(36);
    id = id + separator + timestamp;
  }
  
  return id;
}

/**
 * 生成菜谱ID
 * @param options 生成选项
 * @returns 菜谱ID字符串
 */
export function generateRecipeId(options: IdGenerationOptions = {}): string {
  const { prefix = 'recipe', length = 12 } = options;
  return generateNanoId(length, { prefix, includeTimestamp: true });
}

/**
 * 生成图片ID
 * @param options 生成选项
 * @returns 图片ID字符串
 */
export function generateImageId(options: IdGenerationOptions = {}): string {
  const { prefix = 'img', length = 12 } = options;
  return generateNanoId(length, { prefix, includeTimestamp: true });
}

/**
 * 生成交易ID
 * @param options 生成选项
 * @returns 交易ID字符串
 */
export function generateTransactionId(options: IdGenerationOptions = {}): string {
  const { prefix = 'txn', length = 16 } = options;
  return generateNanoId(length, { prefix, includeTimestamp: true });
}

/**
 * 验证ID格式
 * @param id 要验证的ID
 * @param pattern 验证模式
 * @returns 验证结果
 */
export function validateId(
  id: string, 
  pattern: RegExp = /^[a-zA-Z0-9-_]+$/
): { isValid: boolean; error?: string } {
  if (!id || typeof id !== 'string') {
    return { isValid: false, error: 'ID must be a non-empty string' };
  }
  
  if (!pattern.test(id)) {
    return { isValid: false, error: 'ID contains invalid characters' };
  }
  
  return { isValid: true };
} 