import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

export interface Cuisine {
  id: number;
  name: string;
  slug?: string;
  cssClass?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}


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

  const fetchCuisines = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cuisines?lang=${locale}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (data.success) {
        // Worker返回的是results字段，不是data字段
        const cuisinesData = data.results || data.data || [];
        // 过滤掉"Others"菜系，不在前端显示
        const filteredCuisines = cuisinesData.filter((cuisine: any) => cuisine.id !== 9);
        
        // 确保数据结构正确，Worker 返回的数据已经通过 formatCuisine 处理过
        // 字段应该是：id, name, slug, cssClass
        const processedCuisines = filteredCuisines.map((cuisine: any) => ({
          id: cuisine.id,
          name: cuisine.name || cuisine.localized_cuisine_name || cuisine.cuisine_name || `Cuisine ${cuisine.id}`,
          slug: cuisine.slug || cuisine.localized_cuisine_slug || cuisine.cuisine_slug,
          cssClass: cuisine.cssClass || cuisine.css_class || 'cuisine-other'
        }));
        
        setCuisines(processedCuisines);
      } else {
        throw new Error('Failed to fetch cuisines');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching cuisines:', err);
      
      // 设置备用数据（不包含Others菜系）
      setCuisines([
        { id: 1, name: 'Chinese' },
        { id: 2, name: 'Italian' },
        { id: 3, name: 'French' },
        { id: 4, name: 'Indian' },
        { id: 5, name: 'Japanese' },
        { id: 6, name: 'Mediterranean' },
        { id: 7, name: 'Thai' },
        { id: 8, name: 'Mexican' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuisines();
  }, [locale]); // 添加 locale 依赖，当语言改变时重新获取数据

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
