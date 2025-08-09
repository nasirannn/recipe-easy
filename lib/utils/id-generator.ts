// ==================== ID 生成工具 ====================

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成Nano ID（用于自定义食材ID等）
 */
export function generateNanoId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成食谱ID（SEO友好格式）
 */
export function generateRecipeId(): string {
  const timestamp = Date.now().toString(36); // 转换为36进制，更短
  const random = generateRandomString(4).toLowerCase();
  return `recipe-${timestamp}-${random}`;
}

/**
 * 生成图片ID
 */
export function generateImageId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `IMG-${timestamp}-${random}`;
}

/**
 * 生成交易ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `TXN-${timestamp}-${random}`;
}

/**
 * 生成UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成系统配置ID
 */
export function generateConfigId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(4);
  return `CFG-${timestamp}-${random}`;
}

/**
 * 生成模型使用记录ID
 */
export function generateModelUsageId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `MODEL-${timestamp}-${random}`;
}

/**
 * 验证ID格式
 */
export function isValidRecipeId(id: string): boolean {
  return /^recipe-[a-z0-9]+-[a-z0-9]{4}$/.test(id);
}

export function isValidImageId(id: string): boolean {
  return /^IMG-\d+-[A-Za-z0-9]{8}$/.test(id);
}

export function isValidTransactionId(id: string): boolean {
  return /^TXN-\d+-[A-Za-z0-9]{6}$/.test(id);
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
} 