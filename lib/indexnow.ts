// IndexNow API 集成
// 用于自动通知搜索引擎页面更新

const INDEXNOW_KEY = '37b20710f87c49ecaf3630a9e797186d'; // 与 public 目录下的文件名一致
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://recipe-easy.com';

// IndexNow 端点
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow', // 通用端点
  'https://www.bing.com/indexnow',     // Bing
  'https://yandex.com/indexnow',       // Yandex
];

export interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/**
 * 提交单个 URL 到 IndexNow
 */
export async function submitUrlToIndexNow(url: string): Promise<boolean> {
  try {
    const fullUrl = url.startsWith('http') ? url : `${SITE_URL}${url}`;
    
    const submission: IndexNowSubmission = {
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [fullUrl]
    };

    // 尝试提交到所有端点
    const promises = INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission),
        });

        if (response.ok) {
          // IndexNow submitted successfully
          return true;
        } else {
          // IndexNow failed
          return false;
        }
      } catch (error) {
        // IndexNow error
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(result => result); // 至少一个成功就返回 true
  } catch (error) {
    // IndexNow submission error
    return false;
  }
}

/**
 * 提交多个 URL 到 IndexNow
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<boolean> {
  try {
    const fullUrls = urls.map(url => 
      url.startsWith('http') ? url : `${SITE_URL}${url}`
    );
    
    const submission: IndexNowSubmission = {
      host: new URL(SITE_URL).hostname,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: fullUrls
    };

    // 尝试提交到所有端点
    const promises = INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission),
        });

        if (response.ok) {
          // IndexNow batch submitted successfully
          return true;
        } else {
          // IndexNow batch failed
          return false;
        }
      } catch (error) {
        // IndexNow batch error
        return false;
      }
    });

    const results = await Promise.all(promises);
    return results.some(result => result);
  } catch (error) {
    // IndexNow batch submission error
    return false;
  }
}

/**
 * 提交网站主要页面到 IndexNow
 */
export async function submitMainPagesToIndexNow(): Promise<boolean> {
  const mainPages = [
    '/',
    '/en',
    '/zh',
    '/en/recipes',
    '/zh/recipes',
    '/en/my-recipes',
    '/zh/my-recipes',
  ];

  return await submitUrlsToIndexNow(mainPages);
}
