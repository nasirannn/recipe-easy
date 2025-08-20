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
      
      const response = await fetch(`/api/cuisines?lang=${locale}`);
      const data = await response.json() as any;
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cuisines');
      }

      const cuisinesData = data.cuisines || [];
      
      // 过滤掉 "Others" 菜系
      const filteredCuisines = cuisinesData.filter((cuisine: Cuisine) => 
        cuisine.slug !== 'others'
      );
      
      // 添加 "全部" 选项
      const processedCuisines = [
        { 
          id: 0, 
          name: locale === 'zh' ? '全部菜系' : 'All Cuisines', 
          slug: 'all' 
        },
        ...filteredCuisines
      ];
      
      setCuisines(processedCuisines);
    } catch (err) {
      console.error('Error fetching cuisines:', err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchCuisines();
  }, [fetchCuisines]); // 添加 locale 依赖，当语言改变时重新获取数据

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
