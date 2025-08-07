import { useState, useEffect, useCallback } from 'react';
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
  setCredits: (credits: UserCredits | null) => void;
  setCanGenerate: (canGenerate: boolean) => void;
  updateCredits: (amount: number) => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  credits: null,
  canGenerate: false,
  setCredits: (credits) => set({ credits }),
  setCanGenerate: (canGenerate) => set({ canGenerate }),
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
  })
}));

export function useUserUsage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 使用全局状态
  const { credits, canGenerate, setCredits, setCanGenerate, updateCredits } = useCreditsStore();
  
  // 获取用户积分情况
  const fetchCredits = useCallback(async () => {
    
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-usage?userId=${user.id}&isAdmin=${isAdmin}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCredits(data.data.credits);
        setCanGenerate(data.data.canGenerate);
      } else {
        // 检查是否是配置错误
        if (data.setup_required) {
          setError(`配置错误: ${data.details}`);
          console.error('🔧 Database setup required:', data.details);
        } else {
          setError(data.error || 'Failed to fetch credits');
        }
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAdmin, setCredits, setCanGenerate]);

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
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCredits(data.data.credits);
        setCanGenerate(data.data.credits.credits >= 1);
        return true;
      } else {
        setError(data.error || 'Failed to spend credits');
        return false;
      }
    } catch (err) {
      setError('Network error');
      console.error('Error spending credits:', err);
      return false;
    }
  }, [user?.id, setCredits, setCanGenerate]);
  
  // 实时更新积分（无需等待API响应）
  const updateCreditsLocally = useCallback((amount: number = 1) => {
    updateCredits(amount);
  }, [updateCredits]);

  // 初始化数据
  useEffect(() => {
    if (user?.id) {
  
      fetchCredits();
    } else {
  
      setCredits(null);
      setCanGenerate(false);
    }
  }, [user?.id, fetchCredits, setCredits, setCanGenerate]);

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
