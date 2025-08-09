// ==================== API 客户端服务 ====================

import { 
  ApiResponse, 
  PaginatedResponse, 
  Recipe, 
  Ingredient, 
  IngredientCategory, 
  Cuisine, 
  UserCredits, 
  CreditTransaction,
  SystemConfig,
  GenerationRequest,
  ImageGenerationRequest,
  APIError,
  ValidationError
} from '@/lib/types';
import { getWorkerApiUrl, config as BASE_CONFIG } from '@/lib/config';

// ==================== 基础API客户端 ====================

class APIClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.baseUrl = BASE_CONFIG.workerUrl;
    this.timeout = BASE_CONFIG.apiTimeout;
    this.maxRetries = BASE_CONFIG.maxRetries;
  }

  /**
   * 发送HTTP请求的通用方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = getWorkerApiUrl(endpoint);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // 网络错误重试逻辑
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.warn(`Request failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error);
        await this.delay(Math.pow(2, retryCount) * 1000); // 指数退避
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        0
      );
    }
  }

  /**
   * 判断是否为可重试的错误
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof APIError) {
      return error.status >= 500 || error.status === 0;
    }
    return error instanceof TypeError && error.message.includes('fetch');
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(getWorkerApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// ==================== API 服务类 ====================

class RecipeEasyAPI {
  private client: APIClient;

  constructor() {
    this.client = new APIClient();
  }

  // ==================== 食材相关API ====================

  /**
   * 获取食材分类
   */
  async getCategories(language = 'en'): Promise<ApiResponse<IngredientCategory[]>> {
    return this.client.get('/api/categories', { lang: language });
  }

  /**
   * 获取食材列表
   */
  async getIngredients(params: {
    category?: string;
    limit?: number;
    offset?: number;
    lang?: string;
  } = {}): Promise<PaginatedResponse<Ingredient>> {
    const searchParams: Record<string, string> = {};
    
    if (params.category) searchParams.category = params.category;
    if (params.limit) searchParams.limit = params.limit.toString();
    if (params.offset) searchParams.offset = params.offset.toString();
    if (params.lang) searchParams.lang = params.lang;

    return this.client.get('/api/ingredients', searchParams);
  }

  /**
   * 获取菜系列表
   */
  async getCuisines(language = 'en'): Promise<ApiResponse<Cuisine[]>> {
    return this.client.get('/api/cuisines', { lang: language });
  }

  // ==================== 用户相关API ====================

  /**
   * 获取用户积分信息
   */
  async getUserCredits(userId: string, isAdmin = false): Promise<ApiResponse<{
    credits: UserCredits;
    canGenerate: boolean;
    availableCredits: number;
  }>> {
    return this.client.get('/api/user-usage', {
      userId,
      isAdmin: isAdmin.toString()
    });
  }

  /**
   * 消费用户积分
   */
  async spendCredits(params: {
    userId: string;
    amount?: number;
    description?: string;
  }): Promise<ApiResponse<{
    credits: UserCredits;
    transactionId: string;
  }>> {
    return this.client.post('/api/user-usage', {
      userId: params.userId,
      action: 'spend',
      amount: params.amount,
      description: params.description
    });
  }

  /**
   * 增加用户积分
   */
  async earnCredits(params: {
    userId: string;
    amount: number;
    description?: string;
  }): Promise<ApiResponse<{
    credits: UserCredits;
    transactionId: string;
  }>> {
    return this.client.post('/api/user-usage', {
      userId: params.userId,
      action: 'earn',
      amount: params.amount,
      description: params.description
    });
  }

  // ==================== 食谱相关API ====================

  /**
   * 获取食谱列表
   */
  async getRecipes(params: {
    limit?: number;
    offset?: number;
    search?: string;
    cuisineId?: string;
    lang?: string;
    adminOnly?: boolean;
  } = {}): Promise<ApiResponse<Recipe[]>> {
    const searchParams: Record<string, string> = {};
    
    if (params.limit) searchParams.limit = params.limit.toString();
    if (params.offset) searchParams.offset = params.offset.toString();
    if (params.search) searchParams.search = params.search;
    if (params.cuisineId) searchParams.cuisineId = params.cuisineId;
    if (params.lang) searchParams.lang = params.lang;
    if (params.adminOnly) searchParams.adminOnly = 'true';

    return this.client.get('/api/recipes', searchParams);
  }

  /**
   * 获取单个食谱
   */
  async getRecipe(recipeId: string, language = 'en'): Promise<ApiResponse<Recipe>> {
    return this.client.get(`/api/recipes/${recipeId}`, { lang: language });
  }

  /**
   * 获取用户的食谱
   */
  async getUserRecipes(userId: string, params: {
    limit?: number;
    offset?: number;
    lang?: string;
  } = {}): Promise<ApiResponse<{
    recipes: Recipe[];
    total: number;
  }>> {
    const searchParams: Record<string, string> = {};
    
    if (params.limit) searchParams.limit = params.limit.toString();
    if (params.offset) searchParams.offset = params.offset.toString();
    if (params.lang) searchParams.lang = params.lang;

    return this.client.get(`/api/recipes/user/${userId}`, searchParams);
  }

  /**
   * 保存食谱
   */
  async saveRecipe(params: {
    userId: string;
    recipes: Recipe[];
  }): Promise<ApiResponse<{
    recipes: Recipe[];
    count: number;
    alreadyExists: boolean;
    hasUpdatedImage: boolean;
  }>> {
    return this.client.post('/api/recipes/save', params);
  }

  /**
   * 删除食谱
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<ApiResponse> {
    return this.client.delete(`/api/recipes/${recipeId}?userId=${userId}`);
  }

  // ==================== 图片相关API ====================

  /**
   * 上传图片
   */
  async uploadImage(params: {
    userId: string;
    recipeId: string;
    imageUrl: string;
    imageModel?: string;
  }): Promise<ApiResponse<{
    imagePath: string;
    imageUrl: string;
  }>> {
    return this.client.post('/api/upload-image', params);
  }

  // ==================== 系统配置API ====================

  /**
   * 获取系统配置
   */
  async getSystemConfig(key: string): Promise<ApiResponse<SystemConfig>> {
    return this.client.get('/api/system-configs', { key });
  }

  /**
   * 设置系统配置
   */
  async setSystemConfig(key: string, value: string): Promise<ApiResponse<SystemConfig>> {
    return this.client.post('/api/system-configs', { key, value });
  }

  /**
   * 记录模型使用情况（已禁用，Worker已删除）
   */
  async recordModelUsage(params: {
    model_name: string;
    model_type: 'language' | 'image';
    model_response_id: string;
    request_details?: string;
  }): Promise<ApiResponse> {
    // Worker已删除，模型使用记录功能暂时禁用
    console.log(`Model usage would be recorded: ${params.model_name}`);
    return {
      success: true,
      data: null,
      message: 'Model usage recording disabled'
    };
  }

  // ==================== 健康检查API ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<ApiResponse<{
    status: string;
    timestamp: string;
    service: string;
  }>> {
    return this.client.get('/health');
  }

  // ==================== 管理员API ====================

  /**
   * 添加数据库列（管理员功能）
   */
  async addColumns(columns: any[]): Promise<ApiResponse> {
    return this.client.post('/api/admin/add-columns', { columns });
  }
}

// ==================== 错误处理工具函数 ====================

/**
 * 处理API错误
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof ValidationError) {
    return `验证错误: ${error.message}`;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '未知错误';
}

/**
 * 检查API响应是否成功
 */
export function isAPISuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * 验证必需参数
 */
export function validateRequired(params: Record<string, any>, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!params[field]) {
      throw new ValidationError(`${field} is required`, field);
    }
  }
}

// ==================== 导出 ====================

// 创建API客户端单例
export const api = new RecipeEasyAPI();

// 导出类型和错误处理
export { APIError, ValidationError };
export type { ApiResponse, PaginatedResponse };

// 默认导出
export default api; 