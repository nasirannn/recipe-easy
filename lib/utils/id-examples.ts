/**
 * ID 生成方法示例和对比
 * 展示不同场景下的最佳实践
 */

import { 
  generateUUID, 
  generateShortUUID, 
  generateNanoId, 
  generateSecureId,
  generateUUIDBasedId 
} from './id-generator';

// 1. UUID/GUID 方式
export function demonstrateUUIDMethods() {
  console.log('=== UUID 方式 ===');
  console.log('标准 UUID:', generateUUID()); // 例如: 550e8400-e29b-41d4-a716-446655440000
  console.log('短 UUID:', generateShortUUID()); // 例如: 550e8400e29b41d4a716446655440000
  console.log('带前缀 UUID:', generateUUIDBasedId('REC')); // 例如: REC-550e8400e29b41d4a716446655440000
}

// 2. Nano ID 方式（推荐用于前端）
export function demonstrateNanoIdMethods() {
  console.log('=== Nano ID 方式 ===');
  console.log('默认长度:', generateNanoId()); // 10位随机字符串
  console.log('自定义长度:', generateNanoId(16)); // 16位随机字符串
  console.log('短长度:', generateNanoId(6)); // 6位随机字符串
}

// 3. 加密安全方式
export function demonstrateSecureMethods() {
  console.log('=== 加密安全方式 ===');
  console.log('安全 ID:', generateSecureId()); // 32位十六进制
  console.log('短安全 ID:', generateSecureId(8)); // 16位十六进制
}

// 4. 不同场景的推荐方案
export const ID_GENERATION_RECOMMENDATIONS = {
  // 前端临时 ID（如 toast、临时状态）
  frontend: {
    method: 'generateNanoId',
    length: 8,
    reason: '简短、快速、足够唯一'
  },
  
  // 用户生成的内容（如自定义食材）
  userContent: {
    method: 'generateNanoId',
    length: 12,
    reason: '平衡长度和唯一性'
  },
  
  // 数据库主键
  database: {
    method: 'generateUUID',
    reason: '标准、广泛支持、极低冲突概率'
  },
  
  // 文件/资源 ID
  resources: {
    method: 'generateShortUUID',
    reason: '无连字符，适合文件名'
  },
  
  // 安全敏感场景
  security: {
    method: 'generateSecureId',
    reason: '使用加密安全的随机数生成器'
  }
};

// 5. 性能对比示例
export function performanceComparison() {
  const iterations = 10000;
  
  console.log('=== 性能对比 (10,000次生成) ===');
  
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateNanoId(8);
  }
  const time1 = performance.now() - start1;
  
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateUUID();
  }
  const time2 = performance.now() - start2;
  
  const start3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateSecureId(8);
  }
  const time3 = performance.now() - start3;
  
  console.log(`Nano ID (8位): ${time1.toFixed(2)}ms`);
  console.log(`UUID: ${time2.toFixed(2)}ms`);
  console.log(`Secure ID (8位): ${time3.toFixed(2)}ms`);
}

// 6. 实际使用示例
export function practicalExamples() {
  console.log('=== 实际使用示例 ===');
  
  // Toast 通知
  const toastId = generateNanoId(8);
  console.log('Toast ID:', toastId);
  
  // 自定义食材
  const customIngredientId = `custom-${generateNanoId(8)}`;
  console.log('自定义食材 ID:', customIngredientId);
  
  // 临时文件
  const tempFileId = generateShortUUID();
  console.log('临时文件 ID:', tempFileId);
  
  // 数据库记录
  const dbRecordId = generateUUID();
  console.log('数据库记录 ID:', dbRecordId);
  
  // 安全令牌
  const securityToken = generateSecureId(16);
  console.log('安全令牌:', securityToken);
} 