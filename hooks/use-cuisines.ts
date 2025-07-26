import { useState, useEffect } from 'react';

export interface Cuisine {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface CuisinesResponse {
  success: boolean;
  data: Cuisine[];
  total: number;
  source: string;
}

interface UseCuisinesReturn {
  cuisines: Cuisine[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCuisines(): UseCuisinesReturn {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCuisines = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cuisines');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CuisinesResponse = await response.json();
      
      if (data.success) {
        setCuisines(data.data);
      } else {
        throw new Error('Failed to fetch cuisines');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching cuisines:', err);
      
      // 设置备用数据
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
  }, []);

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
