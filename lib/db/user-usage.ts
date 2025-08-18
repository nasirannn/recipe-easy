// 用户积分管理
export interface UserCredits {
  id: string;
  userId: string;
  credits: number; // 当前积分余额
  totalEarned: number; // 总获得积分
  totalSpent: number; // 总消费积分

  createdAt: string;
  updatedAt: string;
}

// 积分交易记录
export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend'; // 获得或消费
  amount: number; // 积分数量
  reason: 'initial' | 'generation' | 'admin_grant'; // 原因
  description: string; // 描述
  createdAt: string;
}



// 积分配置常量
export const CREDITS_CONFIG = {
  INITIAL_CREDITS: 7, // 初始积分

  GENERATION_COST: 1, // 生成消费积分
  ADMIN_UNLIMITED: true, // 管理员无限制
} as const;

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}



// 计算用户是否可以生成
export function canUserGenerate(credits: UserCredits, isAdmin: boolean = false): {
  canGenerate: boolean;
  credits: number;
} {
  if (isAdmin && CREDITS_CONFIG.ADMIN_UNLIMITED) {
    return {
      canGenerate: true,
      credits: Infinity,
    };
  }

  return {
    canGenerate: credits.credits >= CREDITS_CONFIG.GENERATION_COST,
    credits: credits.credits,
  };
}

import { getD1Database } from './d1-client';

// Cloudflare D1数据库操作类
class UserCreditsStore {
  private static instance: UserCreditsStore;
  private db: ReturnType<typeof getD1Database>;

  constructor() {
    this.db = getD1Database();
  }

  static getInstance(): UserCreditsStore {
    if (!UserCreditsStore.instance) {
      UserCreditsStore.instance = new UserCreditsStore();
    }
    return UserCreditsStore.instance;
  }

  // 获取用户积分信息
  async getUserCredits(userId: string): Promise<UserCredits> {
    try {
      // 查询用户积分
      const result = await this.db
        .prepare('SELECT * FROM user_credits WHERE user_id = ?')
        .bind(userId)
        .first<UserCredits>();

      if (result) {
        return {
          id: result.id,
          userId: result.userId,
          credits: result.credits,
          totalEarned: result.totalEarned,
          totalSpent: result.totalSpent,

          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
      }

      // 创建新用户记录，初始化7积分
      const newCredits: UserCredits = {
        id: generateId(),
        userId,
        credits: CREDITS_CONFIG.INITIAL_CREDITS,
        totalEarned: CREDITS_CONFIG.INITIAL_CREDITS,
        totalSpent: 0,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 插入新用户记录
      await this.db
        .prepare(`
          INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          newCredits.id,
          newCredits.userId,
          newCredits.credits,
          newCredits.totalEarned,
          newCredits.totalSpent,
          newCredits.createdAt,
          newCredits.updatedAt
        )
        .run();

      // 记录初始积分交易
      await this.addTransaction(userId, 'earn', CREDITS_CONFIG.INITIAL_CREDITS, 'initial', 'Initial credits for new user');

      return newCredits;
    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }

  // 添加交易记录
  async addTransaction(userId: string, type: 'earn' | 'spend', amount: number, reason: CreditTransaction['reason'], description: string): Promise<CreditTransaction> {
    try {
      const transaction: CreditTransaction = {
        id: generateId(),
        userId,
        type,
        amount,
        reason,
        description,
        createdAt: new Date().toISOString(),
      };

      await this.db
        .prepare(`
          INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          transaction.id,
          transaction.userId,
          transaction.type,
          transaction.amount,
          transaction.reason,
          transaction.description,
          transaction.createdAt
        )
        .run();

      return transaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  // 更新用户积分
  async updateCredits(userId: string, updates: Partial<UserCredits>): Promise<UserCredits> {
    try {
      const credits = await this.getUserCredits(userId);
      const updatedCredits = {
        ...credits,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.db
        .prepare(`
          UPDATE user_credits
          SET credits = ?, total_earned = ?, total_spent = ?, updated_at = ?
          WHERE user_id = ?
        `)
        .bind(
          updatedCredits.credits,
          updatedCredits.totalEarned,
          updatedCredits.totalSpent,
          updatedCredits.updatedAt,
          userId
        )
        .run();

      return updatedCredits;
    } catch (error) {
      console.error('Error updating credits:', error);
      throw error;
    }
  }

  // 消费积分（生成菜谱）
  async spendCredits(userId: string, amount: number = CREDITS_CONFIG.GENERATION_COST): Promise<{ success: boolean; message: string; credits?: UserCredits }> {
    const credits = await this.getUserCredits(userId);

    if (credits.credits < amount) {
      return {
        success: false,
        message: 'Insufficient credits',
      };
    }

    const updatedCredits = await this.updateCredits(userId, {
      credits: credits.credits - amount,
      totalSpent: credits.totalSpent + amount,
    });

    // 记录消费交易
    await this.addTransaction(userId, 'spend', amount, 'generation', `Spent ${amount} credits for recipe generation`);

    return {
      success: true,
      message: `Successfully spent ${amount} credits`,
      credits: updatedCredits,
    };
  }



  // 获取交易历史
  async getTransactionHistory(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT * FROM credit_transactions
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .bind(userId, limit)
        .all<CreditTransaction>();

      return result.results || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // 管理员授予积分
  async grantCredits(userId: string, amount: number, description: string): Promise<UserCredits> {
    try {
      const credits = await this.getUserCredits(userId);

      const updatedCredits = await this.updateCredits(userId, {
        credits: credits.credits + amount,
        totalEarned: credits.totalEarned + amount,
      });

      // 记录管理员授予交易
      await this.addTransaction(userId, 'earn', amount, 'admin_grant', description);

      return updatedCredits;
    } catch (error) {
      console.error('Error granting credits:', error);
      throw error;
    }
  }
}

export const userCreditsStore = UserCreditsStore.getInstance();
