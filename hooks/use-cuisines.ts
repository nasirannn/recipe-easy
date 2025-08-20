import { useState, useEffect } from 'react';
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

  const fetchCuisines = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 开始获取菜系数据，语言:', locale);
      const response = await fetch(getWorkerApiUrl(`/api/cuisines?lang=${locale}`));
      
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
      const errorMessage = err instanceof Error ? err.message : '获取菜系数据失败';
      setError(errorMessage);
      console.error('Error fetching cuisines:', err);
      
      // 设置备用数据（不包含Others菜系）
      const fallbackCuisines: Cuisine[] = locale === 'zh' ? [
        { id: 1, name: '中式', slug: 'chinese', cssClass: 'cuisine-chinese' },
        { id: 2, name: '意式', slug: 'italian', cssClass: 'cuisine-italian' },
        { id: 3, name: '法式', slug: 'french', cssClass: 'cuisine-french' },
        { id: 4, name: '印式', slug: 'indian', cssClass: 'cuisine-indian' },
        { id: 5, name: '日式', slug: 'japanese', cssClass: 'cuisine-japanese' },
        { id: 6, name: '地中海', slug: 'mediterranean', cssClass: 'cuisine-mediterranean' },
        { id: 7, name: '泰式', slug: 'thai', cssClass: 'cuisine-thai' },
        { id: 8, name: '墨西哥', slug: 'mexican', cssClass: 'cuisine-mexican' },
      ] : [
        { id: 1, name: 'Chinese', slug: 'chinese', cssClass: 'cuisine-chinese' },
        { id: 2, name: 'Italian', slug: 'italian', cssClass: 'cuisine-italian' },
        { id: 3, name: 'French', slug: 'french', cssClass: 'cuisine-french' },
        { id: 4, name: 'Indian', slug: 'indian', cssClass: 'cuisine-indian' },
        { id: 5, name: 'Japanese', slug: 'japanese', cssClass: 'cuisine-japanese' },
        { id: 6, name: 'Mediterranean', slug: 'mediterranean', cssClass: 'cuisine-mediterranean' },
        { id: 7, name: 'Thai', slug: 'thai', cssClass: 'cuisine-thai' },
        { id: 8, name: 'Mexican', slug: 'mexican', cssClass: 'cuisine-mexican' },
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
