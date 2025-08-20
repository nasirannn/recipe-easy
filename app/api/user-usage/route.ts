import { NextRequest, NextResponse } from 'next/server';
import { validateUserId } from '@/lib/utils/validation';
import { D1Database } from '@cloudflare/workers-types';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 获取系统配置
async function getSystemConfig(db: D1Database, key: string, defaultValue: any): Promise<any> {
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
    console.error(`Error getting system config ${key}:`, error);
    return defaultValue;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    
    // 🔒 安全修复：严格验证用户输入
    const userValidation = validateUserId(rawUserId);
    if (!userValidation.isValid) {
      return NextResponse.json({ error: userValidation.error }, { status: 400 });
    }

    const userId = userValidation.userId!;
    const isAdmin = searchParams.get('isAdmin') === 'true';

    // 获取数据库实例
    let db = (request as any).env?.RECIPE_EASY_DB;
    
    // 在本地开发环境中，如果没有数据库绑定，返回模拟数据
    if (!db) {
      console.log('Database not available in development environment, returning mock data');
      return NextResponse.json({
        success: true,
        credits: {
          id: 'mock-credit-id',
          user_id: userId,
          credits: 100,
          total_earned: 100,
          total_spent: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        canGenerate: true,
        availableCredits: 100,
      });
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

    // 检查是否可以生成
    const adminUnlimited = await getSystemConfig(db, 'admin_unlimited', true);
    const canGenerate = (isAdmin && adminUnlimited) || (userCredits.credits as number) > 0;

    return NextResponse.json({
      success: true,
      credits: userCredits,
      canGenerate,
      availableCredits: userCredits.credits,
    });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: bodyUserId, action, amount, description } = body;

    // 🔒 安全修复：严格验证用户输入
    const userValidation = validateUserId(bodyUserId);
    if (!userValidation.isValid) {
      return NextResponse.json({ error: userValidation.error }, { status: 400 });
    }
    
    const userId = userValidation.userId!;

    // 获取数据库实例
    let db = (request as any).env?.RECIPE_EASY_DB;
    
    // 在本地开发环境中，如果没有数据库绑定，返回模拟数据
    if (!db) {
      console.log('Database not available in development environment, returning mock data for POST');
      return NextResponse.json({
        success: true,
        message: 'Mock operation completed',
        data: { 
          credits: {
            id: 'mock-credit-id',
            user_id: userId,
            credits: 99,
            total_earned: 100,
            total_spent: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          transactionId: 'mock-transaction-id' 
        }
      });
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
        INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
        VALUES (?, ?, 'spend', ?, 'generation', ?, DATETIME('now'))
        RETURNING *
      `).bind(transactionId, userId, generationCost, description || `Generated a recipe for ${generationCost} credits.`).first();

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
        INSERT INTO credit_transactions (id, user_id, type, amount, reason, description, created_at)
        VALUES (?, ?, 'earn', ?, 'earned', ?, DATETIME('now'))
        RETURNING *
      `).bind(transactionId, userId, earnAmount, description || `Earned ${earnAmount} credits.`).first();

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
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
