/**
 * ID 生成工具
 */

// 生成随机字符串
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成 UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成短 UUID（无连字符）
export function generateShortUUID(): string {
  return generateUUID().replace(/-/g, '');
}

// 生成 Recipe ID
export function generateRecipeId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `REC-${timestamp}-${random}`;
}

// 验证 Recipe ID 格式
export function isValidRecipeId(id: string): boolean {
  const pattern = /^REC-\d{13}-[A-Za-z0-9]{6}$/;
  return pattern.test(id);
}

// 从 Recipe ID 中提取时间戳
export function getTimestampFromRecipeId(id: string): number | null {
  if (!isValidRecipeId(id)) {
    return null;
  }
  
  const match = id.match(/^REC-(\d{13})-/);
  return match ? parseInt(match[1]) : null;
}

// 生成用户友好的短 ID（用于显示）
export function generateShortRecipeId(): string {
  const timestamp = Date.now().toString(36); // 转换为36进制，更短
  const random = generateRandomString(4);
  return `${timestamp}-${random}`;
}

// 生成图片 ID
export function generateImageId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `IMG-${timestamp}-${random}`;
}

// 生成事务 ID
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `TXN-${timestamp}-${random}`;
}

// 基于 UUID 的 ID 生成方法
export function generateUUIDBasedId(prefix: string = ''): string {
  const uuid = generateShortUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

// 基于 Nano ID 风格的生成（更短的随机字符串）
export function generateNanoId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 基于加密安全的随机数生成
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
} 