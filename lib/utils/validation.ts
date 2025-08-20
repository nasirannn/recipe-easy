/**
 * 验证和限制分页参数
 * @param limit 限制数量
 * @param offset 偏移量
 * @returns 验证后的分页参数
 */
export function validatePaginationParams(limit: string | null, offset: string | null): { limit: number; offset: number } {
  let limitNum = parseInt(limit || '10');
  let offsetNum = parseInt(offset || '0');
  
  // 限制参数范围，防止恶意请求
  limitNum = Math.min(Math.max(limitNum, 1), 100); // 限制在1-100之间
  offsetNum = Math.max(offsetNum, 0); // 不能为负数
  
  return { limit: limitNum, offset: offsetNum };
}

/**
 * 验证搜索参数
 * @param search 搜索关键词
 * @returns 验证后的搜索参数
 */
export function validateSearchParam(search: string | null): string | null {
  if (!search) return null;
  
  // 验证搜索参数长度，防止过长的搜索词
  const sanitizedSearch = search.trim().substring(0, 100); // 限制搜索词长度
  return sanitizedSearch.length > 0 ? sanitizedSearch : null;
}

/**
 * 验证用户ID格式
 * @param userId 用户ID
 * @returns 验证结果
 */
export function validateUserId(userId: string | undefined): boolean {
  if (!userId) {
    return false;
  }
  
  // Check for UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(userId)) {
    return false;
  }
  
  return true;
}

/**
 * 验证菜谱ID格式
 * @param recipeId 菜谱ID
 * @returns 验证结果
 */
export function validateRecipeId(recipeId: string | null): { isValid: boolean; recipeId?: number; error?: string } {
  if (!recipeId || typeof recipeId !== 'string') {
    return { isValid: false, error: 'Invalid recipe ID' };
  }
  
  const id = parseInt(recipeId);
  if (isNaN(id) || id <= 0) {
    return { isValid: false, error: 'Invalid recipe ID format' };
  }
  
  return { isValid: true, recipeId: id };
} 