/**
 * 模型使用记录追踪工具
 * 专注于记录模型使用情况，不包含用户和交易信息
 * 使用id字段存储大模型返回的ID
 */

export interface ModelUsageRecord {
  id: string;                              // 大模型返回的ID
  model_name: string;
  model_type: 'language' | 'image';
  request_details?: string;
  created_at: string;
}

/**
 * 记录语言模型使用情况
 * @param params 使用参数
 * @returns 使用记录对象
 */
export function trackLanguageModelUsage(params: {
  model_name: string;
  model_response_id: string;               // 大模型返回的ID
  request_details?: string;
}): ModelUsageRecord {
  const now = getBeijingTimeString();
  
  return {
    id: params.model_response_id,          // 使用大模型返回的ID作为主键
    model_name: params.model_name,
    model_type: 'language',
    request_details: params.request_details,
    created_at: now
  };
}

/**
 * 记录图片模型使用情况
 * @param params 使用参数
 * @returns 使用记录对象
 */
export function trackImageModelUsage(params: {
  model_name: string;
  model_response_id: string;               // 大模型返回的ID
  request_details?: string;
}): ModelUsageRecord {
  const now = getBeijingTimeString();
  
  return {
    id: params.model_response_id,          // 使用大模型返回的ID作为主键
    model_name: params.model_name,
    model_type: 'image',
    request_details: params.request_details,
    created_at: now
  };
}

/**
 * 验证模型使用记录
 * @param record 使用记录
 * @returns 验证结果
 */
export function validateModelUsageRecord(record: ModelUsageRecord): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.id) {
    errors.push('ID is required (should be the model response ID)');
  }
  
  if (!record.model_name) {
    errors.push('Model name is required');
  }
  
  if (!record.model_type || !['language', 'image'].includes(record.model_type)) {
    errors.push('Model type must be either "language" or "image"');
  }
  
  if (!record.created_at) {
    errors.push('Created at timestamp is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 格式化模型使用记录用于显示
 * @param record 模型使用记录
 * @returns 格式化的记录
 */
export function formatModelUsageRecord(record: ModelUsageRecord) {
  return {
    id: record.id,
    model_name: record.model_name,
    model_type: record.model_type,
    request_details: record.request_details || 'N/A',
    created_at: record.created_at
  };
}

/**
 * 生成UUID（用于生成唯一标识符）
 * @returns UUID字符串
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 获取北京时间字符串
 * @returns 北京时间字符串
 */
function getBeijingTimeString(): string {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return beijingTime.toISOString();
} 