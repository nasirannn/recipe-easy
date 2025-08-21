import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Cuisine } from '@/lib/types';
import { getWorkerApiUrl } from '@/lib/config';

interface UseCuisinesReturn {
  cuisines: Cuisine[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCuisines(): UseCuisinesReturn {
  const locale = useLocale();
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuisines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用 getWorkerApiUrl 确保正确的 API 路径
      const response = await fetch(getWorkerApiUrl(`/api/cuisines?lang=${locale}`));
      const data = await response.json() as any;
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cuisines');
      }

      // 检查数据结构 - 适配新的 API 响应格式
      const cuisinesData = data.results || data.cuisines || [];
      
      if (!Array.isArray(cuisinesData)) {
        throw new Error('Invalid cuisines data format');
      }
      
      // 过滤掉 "Others" 菜系
      const filteredCuisines = cuisinesData.filter((cuisine: Cuisine) => 
        cuisine.slug !== 'others'
      );
      
      setCuisines(filteredCuisines);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cuisines';
      setError(errorMessage);
      console.error('Error fetching cuisines:', err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchCuisines();
  }, [fetchCuisines]);

  const refetch = () => {
    fetchCuisines();
  };

  return {
    cuisines,
    loading,
    error,
    refetch
  };
}
