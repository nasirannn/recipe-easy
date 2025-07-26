/**
 * Cloudflare API客户端工具，用于与Cloudflare Workers和D1通信
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL || 'http://localhost:8787';

// API请求客户端
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 菜系相关接口
export const cuisineApi = {
  // 获取所有菜系
  async listCuisines(): Promise<ApiResponse> {
    try {
      const response = await apiClient.get('/api/cuisines');
      return response.data;
    } catch (error: any) {
      console.error('获取菜系列表失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取菜系列表失败',
      };
    }
  },

  // 获取单个菜系
  async getCuisine(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(`/api/cuisines/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('获取菜系详情失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取菜系详情失败',
      };
    }
  },

  // 创建新菜系（仅管理员）
  async createCuisine(cuisineData: any, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/api/cuisines', {
        ...cuisineData,
        userId
      }, {
        headers: {
          'user-id': userId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('创建菜系失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '创建菜系失败',
      };
    }
  },

  // 更新菜系（仅管理员）
  async updateCuisine(id: number, cuisineData: any, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/api/cuisines/${id}`, {
        ...cuisineData,
        userId
      }, {
        headers: {
          'user-id': userId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('更新菜系失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '更新菜系失败',
      };
    }
  },

  // 删除菜系（仅管理员）
  async deleteCuisine(id: number, userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/api/cuisines/${id}`, {
        headers: {
          'user-id': userId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('删除菜系失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '删除菜系失败',
      };
    }
  }
};

// 修改食谱API，添加按菜系筛选功能
export const recipeApi = {
  // 获取所有食谱，支持按菜系筛选
  async listRecipes(limit = 10, offset = 0, cuisineId?: number): Promise<ApiResponse> {
    try {
      let url = `/api/recipes?limit=${limit}&offset=${offset}`;
      if (cuisineId) {
        url += `&cuisine_id=${cuisineId}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('获取食谱列表失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取食谱列表失败',
      };
    }
  },

  // 获取单个食谱
  async getRecipe(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(`/api/recipes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('获取食谱详情失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取食谱详情失败',
      };
    }
  },

  // 创建新食谱
  async createRecipe(recipeData: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/api/recipes', recipeData);
      return response.data;
    } catch (error: any) {
      console.error('创建食谱失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '创建食谱失败',
      };
    }
  },

  // 更新食谱
  async updateRecipe(id: number, recipeData: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
      return response.data;
    } catch (error: any) {
      console.error('更新食谱失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '更新食谱失败',
      };
    }
  },

  // 删除食谱
  async deleteRecipe(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/api/recipes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('删除食谱失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '删除食谱失败',
      };
    }
  }
};

// 用户相关接口
export const userApi = {
  // 获取用户信息
  async getUser(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(`/api/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取用户信息失败',
      };
    }
  },

  // 创建新用户
  async createUser(userData: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/api/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('创建用户失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '创建用户失败',
      };
    }
  },

  // 更新用户信息
  async updateUser(id: string, userData: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '更新用户信息失败',
      };
    }
  }
};

// 用户偏好相关接口
export const preferencesApi = {
  // 获取用户偏好
  async getUserPreferences(userId: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(`/api/preferences/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('获取用户偏好失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '获取用户偏好失败',
      };
    }
  },

  // 设置用户偏好
  async setUserPreferences(userId: string, preferencesData: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/api/preferences/${userId}`, preferencesData);
      return response.data;
    } catch (error: any) {
      console.error('设置用户偏好失败:', error);
      return {
        success: false,
        error: error.response?.data?.error || '设置用户偏好失败',
      };
    }
  }
}; 