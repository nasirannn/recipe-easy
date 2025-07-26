"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻译数据
const translations = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.testimonials': 'Testimonials',
    'nav.faq': 'FAQ',
    
    // Hero Section
    'hero.title': 'With our AI-powered assistant, you can generate recipes easily',
    'hero.subtitle': 'No longer have to worry about what to eat for dinner with our random recipe generator!',
    
    // Features Section
    'features.subtitle': 'Brand New AI Recipe Generator',
    'features.title': 'Free Online AI Recipes Generator',
    'features.description': 'Simply select or enter the ingredients, and our AI will craft random,creative and easy-to-follow recipes for you. No more "What\'s for dinner?" stress.',
    'features.tryNow': 'Try It Now',
    
    // FAQ Section
    'faq.title': 'Frequently Asked Questions',
    
    // Footer
    'footer.description': 'RecipeEasy - Your AI-powered cooking companion',
    'footer.copyright': '© 2024 RecipeEasy. All rights reserved.',
  },
  zh: {
    // Navigation
    'nav.features': '功能特色',
    'nav.testimonials': '用户评价',
    'nav.faq': '常见问题',
    
    // Hero Section
    'hero.title': '借助我们的 AI 助手，您可以轻松生成食谱',
    'hero.subtitle': '再也不用为晚餐吃什么而烦恼，我们的随机食谱生成器来帮您！',
    
    // Features Section
    'features.subtitle': '全新 AI 食谱生成器',
    'features.title': '免费在线 AI 食谱生成器',
    'features.description': '只需选择或输入食材，我们的 AI 就会为您制作随机、创意且易于跟随的食谱。再也不用为"晚餐吃什么？"而烦恼。',
    'features.tryNow': '立即试用',
    
    // FAQ Section
    'faq.title': '常见问题',
    
    // Footer
    'footer.description': 'RecipeEasy - 您的 AI 烹饪助手',
    'footer.copyright': '© 2024 RecipeEasy. 保留所有权利。',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // 从 localStorage 读取语言设置
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // 保存语言设置到 localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // 翻译函数
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
