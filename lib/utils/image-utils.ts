/**
 * 图片处理工具（通用版本）
 * 不依赖 Cloudflare Worker 运行时绑定，适用于 Vercel/Node.js 环境。
 */

/**
 * 获取文件 Content-Type
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
 * 生成安全的图片对象路径
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
 * 从 URL 下载图片
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
 * 构建图片 URL
 */
export function buildImageUrl(baseUrl: string, imagePath: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${imagePath.replace(/^\/+/, '')}`;
}

/**
 * 验证图片 URL 格式
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
    return validExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}
