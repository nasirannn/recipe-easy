import { createElement, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { create } from 'zustand';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';
import { Gift } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

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
      canGenerate: updatedCredits.credits >= APP_CONFIG.recipeGenerationCost
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
  const locale = useLocale();
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
      
      const response = await fetch(`/api/user-usage?userId=${user.id}`);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (data.success) {
        setCredits(data.credits);
        setCanGenerate(data.canGenerate);

        const grantedAmount = Number(data?.dailyLoginBonus?.grantedAmount ?? 0);
        if (grantedAmount > 0) {
          const isZh = locale.toLowerCase().startsWith('zh');
          const bonusText = Number.isInteger(grantedAmount)
            ? String(grantedAmount)
            : grantedAmount.toFixed(1);
          const bonusTitle = isZh ? '每日登录奖励' : 'Daily Login Bonus!';
          const bonusDescription = isZh
            ? `你已获得 ${bonusText} 积分登录奖励，仅限当天（UTC）有效，请及时使用。`
            : `You have received ${bonusText} credits as a daily login bonus. They are only valid today (UTC) - use them up soon.`;

          toast.success(
            createElement(
              'span',
              { className: 'inline-flex items-center gap-2' },
              createElement(Gift, { className: 'h-4 w-4 text-primary' }),
              createElement('span', { className: 'text-sm font-semibold text-foreground' }, bonusTitle)
            ),
            {
              icon: null,
              description: bonusDescription,
              duration: 5600,
              className: 'border border-border/70 bg-background/95 text-foreground shadow-lg',
              classNames: {
                description: 'text-sm leading-6 text-muted-foreground',
              },
            }
          );
        }
      } else {
        // 检查是否是配置错误
        if (data.setup_required) {
          setError(`配置错误: ${data.details}`);
          // Database setup required
        } else {
          setError(data.error || 'Failed to fetch credits');
        }
        setCredits(null);
        setCanGenerate(false);
      }
    } catch (err) {
      setError('Network error');
      setCredits(null);
      setCanGenerate(false);
      // Error fetching credits
    } finally {
      // 无论成功或失败，都结束初始化，避免登录后无限请求
      setInitialized(true);
      setLoading(false);
      setRequestInProgress(false);
    }
  }, [user?.id, locale, setCredits, setCanGenerate, setLoading, setError, setInitialized, setRequestInProgress, requestInProgress]);

  // 消费积分
  const spendCredits = useCallback(async (amount: number = APP_CONFIG.recipeGenerationCost) => {
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

      const data = await response.json() as any;

      if (data.success) {
        setCredits(data.credits);
        setCanGenerate(data.credits.credits >= APP_CONFIG.recipeGenerationCost);
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
    canGenerate,
    loading,
    error,
    spendCredits,
    updateCreditsLocally,
    isLoggedIn: !!user?.id,
  };
}
