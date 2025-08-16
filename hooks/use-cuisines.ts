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

      console.log('🔍 开始获取菜系数据，语言:', locale);
      const response = await fetch(`/api/cuisines?lang=${locale}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      console.log('🔍 API响应数据:', data);
      
      if (data.success) {
        // Worker返回的是results字段，不是data字段
        const cuisinesData = data.results || data.data || [];
        console.log('🔍 原始菜系数据:', cuisinesData);
        
        // 过滤掉"Others"菜系，不在前端显示
        const filteredCuisines = cuisinesData.filter((cuisine: any) => cuisine.id !== 9);
        console.log('🔍 过滤后菜系数据:', filteredCuisines);
        
        // 处理数据结构，Worker端已经返回正确的本地化名称
        const processedCuisines = filteredCuisines.map((cuisine: any) => ({
          id: cuisine.id,
          name: cuisine.name, // Worker端已经返回正确的本地化名称
          slug: cuisine.slug,
          cssClass: cuisine.cssClass || cuisine.css_class || 'cuisine-other'
        }));
        
        console.log('🔍 处理后的菜系数据:', processedCuisines);
        setCuisines(processedCuisines);
      } else {
        throw new Error('Failed to fetch cuisines');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching cuisines:', err);
      
      // 设置备用数据（不包含Others菜系）
      const fallbackCuisines = locale === 'zh' ? [
        { id: 1, name: '中式' },
        { id: 2, name: '意式' },
        { id: 3, name: '法式' },
        { id: 4, name: '印式' },
        { id: 5, name: '日式' },
        { id: 6, name: '地中海' },
        { id: 7, name: '泰式' },
        { id: 8, name: '墨西哥' },
      ] : [
        { id: 1, name: 'Chinese' },
        { id: 2, name: 'Italian' },
        { id: 3, name: 'French' },
        { id: 4, name: 'Indian' },
        { id: 5, name: 'Japanese' },
        { id: 6, name: 'Mediterranean' },
        { id: 7, name: 'Thai' },
        { id: 8, name: 'Mexican' },
      ];
      setCuisines(fallbackCuisines);
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
