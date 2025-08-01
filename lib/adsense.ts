// Google AdSense 配置和工具函数

// AdSense 发布商 ID
export const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXX'

// AdSense 客户端 ID
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-google'

// 广告单元配置
export const AD_UNITS = {
  // 横幅广告
  BANNER: {
    id: 'banner-ad',
    adSlot: '1234567890',
    format: 'auto',
    responsive: true,
    style: { display: 'block', textAlign: 'center' }
  },
  
  // 侧边栏广告
  SIDEBAR: {
    id: 'sidebar-ad',
    adSlot: '0987654321',
    format: 'auto',
    responsive: true,
    style: { display: 'block', textAlign: 'center' }
  },
  
  // 内容中广告
  CONTENT: {
    id: 'content-ad',
    adSlot: '1122334455',
    format: 'auto',
    responsive: true,
    style: { display: 'block', textAlign: 'center', margin: '20px 0' }
  },
  
  // 页脚广告
  FOOTER: {
    id: 'footer-ad',
    adSlot: '5566778899',
    format: 'auto',
    responsive: true,
    style: { display: 'block', textAlign: 'center', marginTop: '20px' }
  }
}

// 检查是否在开发环境
export const isDevelopment = process.env.NODE_ENV === 'development'

// 检查是否已加载 AdSense
export const isAdSenseLoaded = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(window as any).adsbygoogle
}

// 初始化 AdSense
export const initializeAdSense = () => {
  if (typeof window === 'undefined') return
  
  try {
    // 检查是否已经初始化
    if ((window as any).adsbygoogle) return
    
    // 创建 AdSense 脚本
    const script = document.createElement('script')
    script.async = true
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`
    script.crossOrigin = 'anonymous'
    
    // 添加到页面
    document.head.appendChild(script)
    
  } catch (error) {
    console.error('Failed to initialize AdSense:', error)
  }
}

// 推送广告到 AdSense
export const pushAd = (adElement: HTMLElement) => {
  if (typeof window === 'undefined') return
  
  try {
    if ((window as any).adsbygoogle) {
      (window as any).adsbygoogle.push({})
    }
  } catch (error) {
    console.error('Failed to push ad:', error)
  }
}

// 声明全局 AdSense 类型
declare global {
  interface Window {
    adsbygoogle: any[]
  }
} 