import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  deleteImageFromR2,
  extractR2ObjectKey,
  isR2S3Configured,
  uploadUserAvatarBufferToR2,
} from '@/lib/server/r2';

export const runtime = 'nodejs';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getBearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization') || '';
  if (!value.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = value.slice(7).trim();
  return token || null;
}

function normalizeMimeType(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    if (!isR2S3Configured()) {
      return NextResponse.json(
        { success: false, error: 'Avatar storage is not configured' },
        { status: 503 }
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Avatar file is required' },
        { status: 400 }
      );
    }

    const requestedUserId = formData.get('userId');
    if (
      typeof requestedUserId === 'string' &&
      requestedUserId.trim() &&
      requestedUserId.trim() !== authData.user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const contentType = normalizeMimeType(fileEntry.type || 'image/jpeg');
    if (!ALLOWED_AVATAR_TYPES.has(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported image format. Please use PNG, JPG, WEBP, or GIF.' },
        { status: 400 }
      );
    }

    if (fileEntry.size <= 0 || fileEntry.size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Avatar file must be between 1 byte and 5MB.' },
        { status: 400 }
      );
    }

    const uploaded = await uploadUserAvatarBufferToR2({
      userId: authData.user.id,
      fileBuffer: Buffer.from(await fileEntry.arrayBuffer()),
      contentType,
      originalFilename: fileEntry.name,
    });

    const oldAvatarUrl = formData.get('oldAvatarUrl');
    if (typeof oldAvatarUrl === 'string' && oldAvatarUrl.trim()) {
      const oldKey = extractR2ObjectKey(oldAvatarUrl);
      if (
        oldKey &&
        oldKey !== uploaded.objectKey &&
        oldKey.startsWith(`avatars/${authData.user.id}/`)
      ) {
        try {
          await deleteImageFromR2(oldAvatarUrl);
        } catch (cleanupError) {
          console.error('Failed to clean up previous avatar:', cleanupError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: uploaded.publicUrl,
      objectKey: uploaded.objectKey,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to upload user avatar:', details);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
