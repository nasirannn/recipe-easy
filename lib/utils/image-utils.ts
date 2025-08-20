/**
 * 图片处理工具
 * 处理图片上传、下载、路径生成等操作
 */

import { R2Bucket } from '@cloudflare/workers-types';
import { generateImageId } from './id-generator';

/**
 * 获取文件Content-Type
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 生成安全的图片路径
 */
export function generateSafeImagePath(
  userId: string,
  recipeId: string,
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const randomString = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
  const sanitizedRecipeId = recipeId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
  return `${sanitizedUserId}/${sanitizedRecipeId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * 从URL下载图片
 */
export async function downloadImageFromUrl(imageUrl: string): Promise<Uint8Array> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const imageBuffer = await response.arrayBuffer();
  return new Uint8Array(imageBuffer);
}

/**
 * 上传图片到R2
 */
export async function uploadImageToR2(
  bucket: R2Bucket,
  path: string,
  imageData: Uint8Array,
  options: {
    contentType?: string;
    userId?: string;
    recipeId?: string;
    imageModel?: string;
  } = {}
): Promise<void> {
  const {
    contentType = 'image/jpeg',
    userId,
    recipeId,
    imageModel = 'unknown'
  } = options;

  await bucket.put(path, imageData, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      userId,
      recipeId,
      imageModel,
      uploadedAt: new Date().toISOString()
    }
  });
}

/**
 * 保存图片记录到数据库
 */
export async function saveImageRecord(
  db: any,
  options: {
    imageId?: string;
    userId: string;
    recipeId: string;
    imagePath: string;
    imageModel?: string;
  }
): Promise<void> {
  const {
    imageId = generateImageId(),
    userId,
    recipeId,
    imagePath,
    imageModel = 'unknown'
  } = options;

  await db.prepare(`
    INSERT INTO recipe_images (
      id, user_id, recipe_id, image_path, image_model, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    imageId,
    userId,
    recipeId,
    imagePath,
    imageModel,
    new Date().toISOString()
  ).run();
}

/**
 * 删除R2中的图片
 */
export async function deleteImageFromR2(
  bucket: R2Bucket,
  imagePath: string
): Promise<boolean> {
  try {
    // 检查图片是否存在
    const imageObject = await bucket.head(imagePath);
    if (imageObject) {
      // 删除存在的图片
      await bucket.delete(imagePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete image ${imagePath}:`, error);
    return false;
  }
}

/**
 * 构建图片URL
 */
export function buildImageUrl(
  baseUrl: string,
  imagePath: string
): string {
  return `${baseUrl}/images/${imagePath}`;
}

/**
 * 验证图片URL格式
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    const pathname = urlObj.pathname.toLowerCase();
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// 过期图片清理功能已移除 