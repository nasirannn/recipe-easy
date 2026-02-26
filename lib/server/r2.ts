import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

type R2Config = {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __recipeEasyR2Client: S3Client | undefined;
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function sanitizePathSegment(value: string, fallback: string): string {
  const sanitized = (value || '')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized || fallback;
}

export function buildRecipeImageObjectKey(params: {
  userId: string;
  recipeId: string;
  extension: string;
  uniqueSuffix?: string;
}): string {
  const extension = sanitizePathSegment(params.extension.replace(/^\.+/, '').toLowerCase(), 'jpg');
  const userId = sanitizePathSegment(params.userId, 'unknown-user');
  const recipeId = sanitizePathSegment(params.recipeId, 'unknown-recipe');
  const uniqueSuffix = sanitizePathSegment(
    params.uniqueSuffix || `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`,
    'image'
  );

  return [
    'recipes',
    userId,
    recipeId,
    `${uniqueSuffix}.${extension}`,
  ].join('/');
}

export function buildUserAvatarObjectKey(params: {
  userId: string;
  extension: string;
  uniqueSuffix?: string;
}): string {
  const extension = sanitizePathSegment(params.extension.replace(/^\.+/, '').toLowerCase(), 'jpg');
  const userId = sanitizePathSegment(params.userId, 'unknown-user');
  const uniqueSuffix = sanitizePathSegment(
    params.uniqueSuffix || `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`,
    'avatar'
  );

  return ['avatars', userId, `${uniqueSuffix}.${extension}`].join('/');
}

export function getR2Config(): R2Config | null {
  const endpoint = process.env.R2_ENDPOINT || '';
  const bucket = process.env.R2_BUCKET_NAME || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
  const publicUrl =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    '';

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint: withoutTrailingSlash(endpoint),
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrl: publicUrl ? withoutTrailingSlash(publicUrl) : undefined,
  };
}

export function isR2S3Configured(): boolean {
  return getR2Config() !== null;
}

function getR2Client(): S3Client {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      'R2 S3 config missing. Set R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.'
    );
  }

  if (!globalThis.__recipeEasyR2Client) {
    globalThis.__recipeEasyR2Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return globalThis.__recipeEasyR2Client;
}

export function buildR2PublicUrl(objectKey: string): string {
  const config = getR2Config();
  const publicBase =
    config?.publicUrl ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    '';

  if (!publicBase) {
    return objectKey;
  }

  return `${withoutTrailingSlash(publicBase)}/${trimSlashes(objectKey)}`;
}

export function extractR2ObjectKey(imagePath: string): string | null {
  const value = (imagePath || '').trim();
  if (!value) {
    return null;
  }

  // Already a key-like relative path.
  if (!/^https?:\/\//i.test(value)) {
    return trimSlashes(value);
  }

  try {
    const url = new URL(value);
    const pathname = trimSlashes(decodeURIComponent(url.pathname));
    if (!pathname) {
      return null;
    }

    const publicBase =
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      '';
    if (publicBase) {
      const normalizedBase = withoutTrailingSlash(publicBase);
      const normalizedInput = withoutTrailingSlash(`${url.origin}`);
      const baseUrl = new URL(normalizedBase);

      if (
        normalizedInput.toLowerCase() === `${baseUrl.protocol}//${baseUrl.host}`.toLowerCase()
      ) {
        return pathname;
      }
    }

    // If URL is not recognized as our public base, do not delete arbitrary remote objects.
    return null;
  } catch {
    return null;
  }
}

function inferContentTypeFromUrl(url: string): string {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) {
    return 'image/png';
  }
  if (path.endsWith('.webp')) {
    return 'image/webp';
  }
  if (path.endsWith('.gif')) {
    return 'image/gif';
  }
  if (path.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  return 'image/jpeg';
}

function inferExtension(contentType: string, fallbackUrl: string): string {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('png')) {
    return 'png';
  }
  if (normalized.includes('webp')) {
    return 'webp';
  }
  if (normalized.includes('gif')) {
    return 'gif';
  }
  if (normalized.includes('svg')) {
    return 'svg';
  }

  const path = fallbackUrl.split('?')[0].toLowerCase();
  if (path.endsWith('.png')) return 'png';
  if (path.endsWith('.webp')) return 'webp';
  if (path.endsWith('.gif')) return 'gif';
  if (path.endsWith('.svg')) return 'svg';
  return 'jpg';
}

export async function uploadUserAvatarBufferToR2(params: {
  userId: string;
  fileBuffer: Buffer;
  contentType: string;
  originalFilename?: string;
}): Promise<{ objectKey: string; publicUrl: string }> {
  const config = getR2Config();
  if (!config) {
    throw new Error('R2 S3 config missing');
  }

  const normalizedType = (params.contentType || 'image/jpeg').toLowerCase();
  const extension = inferExtension(normalizedType, params.originalFilename || '');
  const objectKey = buildUserAvatarObjectKey({
    userId: params.userId,
    extension,
  });

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: params.fileBuffer,
      ContentType: normalizedType,
      Metadata: {
        userId: params.userId,
        type: 'avatar',
      },
    })
  );

  return {
    objectKey,
    publicUrl: buildR2PublicUrl(objectKey),
  };
}

export async function uploadImageFromUrlToR2(params: {
  sourceUrl: string;
  userId: string;
  recipeId: string;
  imageModel?: string;
}): Promise<{ objectKey: string; publicUrl: string }> {
  const config = getR2Config();
  if (!config) {
    throw new Error('R2 S3 config missing');
  }

  const response = await fetch(params.sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType =
    response.headers.get('content-type') ||
    inferContentTypeFromUrl(params.sourceUrl);
  const extension = inferExtension(contentType, params.sourceUrl);
  const objectKey = buildRecipeImageObjectKey({
    userId: params.userId,
    recipeId: params.recipeId,
    extension,
  });

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: Buffer.from(buffer),
      ContentType: contentType,
      Metadata: {
        userId: params.userId,
        recipeId: params.recipeId,
        imageModel: params.imageModel || 'unknown',
      },
    })
  );

  return {
    objectKey,
    publicUrl: buildR2PublicUrl(objectKey),
  };
}

export async function deleteImageFromR2(imagePath: string): Promise<boolean> {
  const config = getR2Config();
  if (!config) {
    return false;
  }

  const key = extractR2ObjectKey(imagePath);
  if (!key) {
    return false;
  }

  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
  return true;
}
