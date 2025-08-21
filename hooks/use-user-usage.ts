import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { create } from 'zustand';

interface UserCredits {
  id: string | null;
  user_id: string;
  credits: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

// 创建全局状态存储
interface CreditsStore {
  credits: UserCredits | null;
  canGenerate: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean; // 是否已初始化
  requestInProgress: boolean; // 请求进行中标志
  setCredits: (credits: UserCredits | null) => void;
  setCanGenerate: (canGenerate: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setRequestInProgress: (inProgress: boolean) => void;
  updateCredits: (amount: number) => void;
  reset: () => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  credits: null,
  canGenerate: false,
  loading: true,
  error: null,
  initialized: false,
  requestInProgress: false,
  setCredits: (credits) => set({ credits }),
  setCanGenerate: (canGenerate) => set({ canGenerate }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (initialized) => set({ initialized }),
  setRequestInProgress: (inProgress) => set({ requestInProgress: inProgress }),
  updateCredits: (amount) => set((state) => {
    if (!state.credits) return state;
    
    const updatedCredits = {
      ...state.credits,
      credits: state.credits.credits - amount,
      total_spent: state.credits.total_spent + amount
    };
    
    return { 
      credits: updatedCredits,
      canGenerate: updatedCredits.credits >= 1
    };
  }),
  reset: () => set({
    credits: null,
    canGenerate: false,
    loading: true,
    error: null,
    initialized: false,
    requestInProgress: false
  })
}));

export function useUserUsage() {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';
  // 使用全局状态
  const { 
    credits, 
    canGenerate, 
    loading, 
    error, 
    initialized, 
    requestInProgress,
    setCredits, 
    setCanGenerate, 
    setLoading, 
    setError, 
    setInitialized,
    setRequestInProgress,
    updateCredits,
    reset
  } = useCreditsStore();
  
  // 获取用户积分情况
  const fetchCredits = useCallback(async () => {
    if (!user?.id) return;
    
    // 如果请求正在进行中，不重复发起请求
    if (requestInProgress) return;
    
    try {
      setRequestInProgress(true);
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-usage?userId=${user.id}&isAdmin=${isAdmin}`);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCredits(data.credits);
        setCanGenerate(data.canGenerate);
        setInitialized(true);
      } else {
        // 检查是否是配置错误
        if (data.setup_required) {
          setError(`配置错误: ${data.details}`);
          // Database setup required
        } else {
          setError(data.error || 'Failed to fetch credits');
        }
      }
    } catch (err) {
      setError('Network error');
      // Error fetching credits
    } finally {
      setLoading(false);
      setRequestInProgress(false);
    }
  }, [user?.id, isAdmin, setCredits, setCanGenerate, setLoading, setError, setInitialized, setRequestInProgress, requestInProgress]);

  // 消费积分
  const spendCredits = useCallback(async (amount: number = 1) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/user-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'spend',
          amount,
          isAdmin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCredits(data.credits);
        setCanGenerate(data.credits.credits >= 1);
        return true;
      } else {
        setError(data.error || 'Failed to spend credits');
        return false;
      }
    } catch (err) {
      setError('Network error');
      // Error spending credits
      return false;
    }
  }, [user?.id, setCredits, setCanGenerate, setError]);
  
  // 实时更新积分（无需等待API响应）
  const updateCreditsLocally = useCallback((amount: number = 1) => {
    updateCredits(amount);
  }, [updateCredits]);

  // 初始化数据
  useEffect(() => {
    if (user?.id) {
      // 只有在未初始化且没有请求进行中时才发起请求
      if (!initialized && !requestInProgress) {
        fetchCredits();
      }
    } else {
      // 用户未登录时重置状态
      reset();
    }
  }, [user?.id, initialized, requestInProgress, fetchCredits, reset]);

  return {
    credits,
    canGenerate: isAdmin ? true : canGenerate,
    loading,
    error,
    spendCredits,
    updateCreditsLocally,
    isLoggedIn: !!user?.id,
  };
}