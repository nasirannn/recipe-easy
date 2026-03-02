import { NextRequest, NextResponse } from 'next/server';
import {
  deleteRecipeById,
  getRecipeById,
  updateRecipeById,
  type RecipeMutationInput,
} from '@/lib/server/recipes';
import { validateUserId } from '@/lib/utils/validation';
import { getPostgresPool } from '@/lib/server/postgres';
import { deleteImageFromR2 } from '@/lib/server/r2';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') ?? searchParams.get('locale') ?? 'en';

    const db = getPostgresPool();
    const recipe = await getRecipeById(db, id, lang);
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch recipe:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe', details },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      userId?: string;
      language?: string;
      recipe?: RecipeMutationInput;
    } & RecipeMutationInput;

    const userId = body.userId;
    if (!validateUserId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const payload: RecipeMutationInput = body.recipe ?? body;
    const db = getPostgresPool();

    const updated = await updateRecipeById(db, id, userId, payload);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found or not owned by user' },
        { status: 404 }
      );
    }

    const recipe = body.language
      ? await getRecipeById(db, id, body.language)
      : (await getRecipeById(db, id, 'en')) ?? (await getRecipeById(db, id, 'zh'));
    return NextResponse.json({
      success: true,
      recipe,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to update recipe:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe', details },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as { userId?: string };
    const userId = body.userId;
    if (!validateUserId(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const db = getPostgresPool();

    const { deleted, imagePaths } = await deleteRecipeById(db, id, userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found or not owned by user' },
        { status: 404 }
      );
    }

    if (imagePaths.length > 0) {
      const cleanupResults = await Promise.allSettled(
        imagePaths.map((path) => deleteImageFromR2(path))
      );
      const rejected = cleanupResults.filter((result) => result.status === 'rejected').length;
      if (rejected > 0) {
        console.error('Failed to clean up some recipe images from R2:', rejected);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete recipe:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe', details },
      { status: 500 }
    );
  }
}
