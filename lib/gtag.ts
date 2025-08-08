// Google Analytics 4 工具函数
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 自定义事件跟踪
export const trackRecipeGeneration = (cuisine?: string, ingredientsCount?: number) => {
  event({
    action: 'generate_recipe',
    category: 'recipe',
    label: cuisine,
    value: ingredientsCount,
  })
}

export const trackUserSignup = (method: string) => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  })
}

export const trackUserLogin = (method: string) => {
  event({
    action: 'login',
    category: 'engagement',
    label: method,
  })
}

export const trackFeatureUsage = (feature: string) => {
  event({
    action: 'feature_usage',
    category: 'engagement',
    label: feature,
  })
}

// 声明全局 gtag 类型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
    clarity: any
  }
} 