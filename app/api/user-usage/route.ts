import { NextRequest, NextResponse } from 'next/server';
import { validateUserId } from '@/lib/utils/validation';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 检查是否有数据库绑定
function hasDatabaseBinding(): boolean {
  try {
    const context = getCloudflareContext();
    return !!context?.env?.RECIPE_EASY_DB;
  } catch {
    return false;
  }
}

// 获取系统配置
async function getSystemConfig(db: any, key: string, defaultValue: any): Promise<any> {
  try {
    const result = await db.prepare(`
      SELECT value FROM system_configs WHERE key = ?
    `).bind(key).first();
    
    if (!result || !result.value) {
      return defaultValue;
    }
    
    const value = String(result.value);
    
    if (typeof defaultValue === 'number') {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? defaultValue : numValue;
    } else if (typeof defaultValue === 'boolean') {
      return value.toLowerCase() === 'true';
    }
    
    return value;
  } catch (error) {
    // Error getting system config
    return defaultValue;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    
    // 🔒 安全修复：严格验证用户输入
    if (!validateUserId(rawUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userId = rawUserId!;
    const isAdmin = searchParams.get('isAdmin') === 'true';

    // 检查是否有数据库绑定
    const hasDb = hasDatabaseBinding();
    
    // 在本地开发环境中，如果没有数据库绑定，返回模拟数据
    if (!hasDb) {
      // Database not available in development environment, returning mock data
      const mockCredits = isAdmin ? 999999 : 100;
      return NextResponse.json({
        success: true,
        credits: {
          id: 'mock-credit-id',
          user_id: userId,
          credits: mockCredits,
          total_earned: mockCredits,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        canGenerate: true,
        availableCredits: mockCredits,
      });
    }

    // 获取数据库实例
    const context = getCloudflareContext();
    const db = context?.env?.RECIPE_EASY_DB;
    if (!db) {
      throw new Error('数据库绑定不可用');
    }

    // 检查表是否存在
    const tableExists = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='user_credits'
    `).first();
    
    if (!tableExists) {
      return NextResponse.json(
        { success: false, error: 'Database setup required: user_credits table missing' },
        { status: 500 }
      );
    }

    // 获取用户积分
    const userCredits = await db.prepare(`
      SELECT * FROM user_credits WHERE user_id = ?
    `).bind(userId).first();

    if (!userCredits) {
      // 从系统配置中获取初始积分
      const initialCredits = await getSystemConfig(db, 'initial_credits', 100);
      
      // 创建新用户积分记录
      const creditId = crypto.randomUUID();
      const newCredits = await db.prepare(`
        INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
        RETURNING *
      `).bind(creditId, userId, initialCredits, initialCredits).first();
      
      return NextResponse.json({
        success: true,
        credits: newCredits,
        canGenerate: true,
        availableCredits: initialCredits,
      });
    }

    // 获取系统配置
    const minCreditsForGeneration = await getSystemConfig(db, 'min_credits_for_generation', 1);
    const canGenerate = userCredits.credits >= minCreditsForGeneration;

    return NextResponse.json({
      success: true,
      credits: userCredits,
      canGenerate,
      availableCredits: userCredits.credits,
    });

  } catch (error) {
    // Error fetching user usage
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user usage' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId: string;
      action: string;
      amount?: number;
      description?: string;
      isAdmin?: boolean;
    };
    const { userId: bodyUserId, action, amount, description, isAdmin: bodyIsAdmin } = body;

    // 🔒 安全修复：严格验证用户输入
    if (!validateUserId(bodyUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    const userId = bodyUserId!;

    // 检查是否有数据库绑定
    const hasDb = hasDatabaseBinding();
    
    // 在本地开发环境中，如果没有数据库绑定，返回模拟数据
    if (!hasDb) {
      // Database not available in development environment, returning mock data for POST
      const isAdmin = bodyIsAdmin === true;
      const mockCredits = isAdmin ? 999998 : 99; // 管理员消费1积分后剩余999998
      const mockTotalEarned = isAdmin ? 999999 : 100;
      const mockTotalSpent = 1;
      
      return NextResponse.json({
        success: true,
        message: 'Mock operation completed',
        data: { 
          credits: {
            id: 'mock-credit-id',
            user_id: userId,
            credits: mockCredits,
            total_earned: mockTotalEarned,
            total_spent: mockTotalSpent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          transactionId: 'mock-transaction-id' 
        }
      });
    }

    const context = getCloudflareContext();
    const db = context?.env?.RECIPE_EASY_DB;
    if (!db) {
      throw new Error('数据库绑定不可用');
    }

    if (action === 'spend') {
      // 从系统配置中获取生成消耗
      const generationCost = amount || await getSystemConfig(db, 'generation_cost', 1);
      
      // 检查表是否存在
      const tableExists = await db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='user_credits'
      `).first();
      
      if (!tableExists) {
        return NextResponse.json(
          { success: false, error: 'Database setup required: user_credits table missing' },
          { status: 500 }
        );
      }
      
      // 消费积分
      const userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();

      if (!userCredits || userCredits.credits < generationCost) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credits.' },
          { status: 400 }
        );
      }

      const updatedCredits = await db.prepare(`
        UPDATE user_credits 
        SET credits = credits - ?, total_spent = total_spent + ?, updated_at = DATETIME('now')
        WHERE user_id = ?
        RETURNING *
      `).bind(generationCost, generationCost, userId).first();

      // 记录交易
      const transactionId = crypto.randomUUID();
      const transaction = await db.prepare(`
        INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
        VALUES (?, ?, 'spend', ?, DATETIME('now'))
        RETURNING *
      `).bind(transactionId, userId, generationCost).first();

      return NextResponse.json({
        success: true,
        message: `Successfully spent ${generationCost} credits.`,
        data: { credits: updatedCredits, transactionId: transaction.id }
      });

    } else if (action === 'earn') {
      const earnAmount = amount || 0;
      
      if (earnAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Earn amount must be positive' },
          { status: 400 }
        );
      }

      // 检查用户积分记录是否存在
      let userCredits = await db.prepare(`
        SELECT * FROM user_credits WHERE user_id = ?
      `).bind(userId).first();

      if (!userCredits) {
        // 创建新用户积分记录
        const creditId = crypto.randomUUID();
        userCredits = await db.prepare(`
          INSERT INTO user_credits (id, user_id, credits, total_earned, total_spent, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, DATETIME('now'), DATETIME('now'))
          RETURNING *
        `).bind(creditId, userId, earnAmount, earnAmount).first();
      } else {
        // 更新现有记录
        userCredits = await db.prepare(`
          UPDATE user_credits 
          SET credits = credits + ?, total_earned = total_earned + ?, updated_at = DATETIME('now')
          WHERE user_id = ?
          RETURNING *
        `).bind(earnAmount, earnAmount, userId).first();
      }

      // 记录交易
      const transactionId = crypto.randomUUID();
      const transaction = await db.prepare(`
        INSERT INTO credit_transactions (id, user_id, type, amount, created_at)
        VALUES (?, ?, 'earn', ?, DATETIME('now'))
        RETURNING *
      `).bind(transactionId, userId, earnAmount).first();

      return NextResponse.json({
        success: true,
        message: `Successfully earned ${earnAmount} credits.`,
        data: { credits: userCredits, transactionId: transaction.id }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    // API Error
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
