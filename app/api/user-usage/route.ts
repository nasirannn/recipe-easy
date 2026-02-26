import { NextRequest, NextResponse } from 'next/server';
import { validateUserId } from '@/lib/utils/validation';
import {
  earnCredits,
  ensureCreditsSchema,
  getGenerationCost,
  getMinCreditsForGeneration,
  settleDailyLoginBonusOnLogin,
  spendCredits,
} from '@/lib/server/credits';
import { getPostgresPool } from '@/lib/server/postgres';

export const runtime = 'nodejs';

function toPositiveNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  return Math.floor(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') ?? undefined;

    if (!validateUserId(userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }
    const normalizedUserId = userId as string;

    const db = getPostgresPool();

    await ensureCreditsSchema(db);
    const dailyLoginBonus = await settleDailyLoginBonusOnLogin(db, normalizedUserId);
    const credits = dailyLoginBonus.credits;
    const minCreditsForGeneration = await getMinCreditsForGeneration(db);

    return NextResponse.json({
      success: true,
      credits,
      canGenerate: credits.credits >= minCreditsForGeneration,
      availableCredits: credits.credits,
      dailyLoginBonus: {
        grantedAmount: dailyLoginBonus.grantedAmount,
        expiredAmount: dailyLoginBonus.expiredAmount,
        expiresAt: dailyLoginBonus.expiresAt,
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch user usage:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user usage', details },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string;
      action?: 'spend' | 'earn';
      amount?: number;
    };

    if (!validateUserId(body.userId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const action = body.action;
    if (action !== 'spend' && action !== 'earn') {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const db = getPostgresPool();

    await ensureCreditsSchema(db);

    const userId = body.userId as string;
    if (action === 'spend') {
      const requestedAmount = toPositiveNumber(body.amount);
      const amount = requestedAmount ?? await getGenerationCost(db);

      try {
        const { credits, transactionId } = await spendCredits(db, userId, amount);
        return NextResponse.json({
          success: true,
          message: `Successfully spent ${amount} credits.`,
          credits,
          transactionId,
          data: { credits, transactionId },
        });
      } catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown error';
        if (details === 'Insufficient credits') {
          return NextResponse.json(
            { success: false, error: 'Insufficient credits' },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    const amount = toPositiveNumber(body.amount);
    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Earn amount must be positive' },
        { status: 400 }
      );
    }

    const { credits, transactionId } = await earnCredits(db, userId, amount);
    return NextResponse.json({
      success: true,
      message: `Successfully earned ${amount} credits.`,
      credits,
      transactionId,
      data: { credits, transactionId },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to process user usage request:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to process request', details },
      { status: 500 }
    );
  }
}
