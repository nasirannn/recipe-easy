import { NextRequest, NextResponse } from 'next/server';
import { deleteMealPlanById, getMealPlanById } from '@/lib/server/meal-plans';
import { getPostgresPool } from '@/lib/server/postgres';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const normalizedId = String(id || '').trim().slice(0, 120);
    if (!normalizedId) {
      return NextResponse.json(
        { success: false, error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getPostgresPool();
    const mealPlan = await getMealPlanById(db, normalizedId);
    if (!mealPlan) {
      return NextResponse.json(
        { success: false, error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    if (mealPlan.userId !== data.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      mealPlan,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch meal plan:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meal plan', details },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const normalizedId = String(id || '').trim().slice(0, 120);
    if (!normalizedId) {
      return NextResponse.json(
        { success: false, error: 'Meal plan ID is required' },
        { status: 400 }
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getPostgresPool();
    const deleted = await deleteMealPlanById(db, normalizedId, data.user.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Meal plan not found or not owned by user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      id: normalizedId,
      message: 'Meal plan deleted successfully',
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete meal plan:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to delete meal plan', details },
      { status: 500 }
    );
  }
}
