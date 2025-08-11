// Google Analytics 4 工具函数
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// 页面浏览跟踪
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// 通用事件跟踪
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 通用跟踪函数
export const track = (action: string, category: string, label?: string, value?: number) => {
  event({ action, category, label, value });
};

// 常用事件跟踪（保持向后兼容）
export const trackRecipeGeneration = (cuisine?: string, ingredientsCount?: number) => {
  track('generate_recipe', 'recipe', cuisine, ingredientsCount);
};

export const trackUserSignup = (method: string) => {
  track('sign_up', 'engagement', method);
};

export const trackUserLogin = (method: string) => {
  track('login', 'engagement', method);
};

export const trackFeatureUsage = (feature: string) => {
  track('feature_usage', 'engagement', feature);
};

// 声明全局 gtag 类型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
    clarity: any;
  }
} 