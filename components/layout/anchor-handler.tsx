"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export const AnchorHandler = () => {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const lastHash = useRef<string>('');
  const lastLocale = useRef<string>('');
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 检查URL中是否有锚点
    const hash = window.location.hash;
    
    // 如果是初始挂载，记录初始状态
    if (isInitialMount.current) {
      lastHash.current = hash;
      lastLocale.current = locale;
      isInitialMount.current = false;
      
      // 只在初始挂载时处理锚点跳转
      if (hash) {
        handleAnchorScroll(hash);
      }
      return;
    }
    
    // 检查是否是语言切换
    const isLocaleChange = locale !== lastLocale.current;
    
    // 如果是语言切换，直接清除锚点
    if (isLocaleChange && hash) {
      // 清除URL中的锚点，不触发滚动
      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
      lastHash.current = '';
      lastLocale.current = locale;
      return;
    }
    
    // 检查是否是真正的锚点变化
    const hasRealAnchorChange = hash !== lastHash.current;
    
    // 只有在锚点真正改变且不是语言切换时才执行滚动
    if (hasRealAnchorChange && hash && !isLocaleChange) {
      lastHash.current = hash;
      handleAnchorScroll(hash);
    }
    
    // 更新记录的状态
    lastHash.current = hash;
    lastLocale.current = locale;
  }, [searchParams, locale, router]);

  const handleAnchorScroll = (hash: string) => {
    try {
      // 移除#号
      const elementId = hash.substring(1);
      const element = document.getElementById(elementId);
      
      if (element) {
        // 延迟执行以确保页面完全加载
        setTimeout(() => {
          try {
            const elementRect = element.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            
            window.scrollTo({
              top: absoluteElementTop - 100, // 留一些顶部空间
              behavior: 'smooth'
            });
          } catch (scrollError) {
            // 静默处理滚动错误
          }
        }, 100);
      }
    } catch (error) {
      // 静默处理错误
    }
  };

  return null; // 这个组件不渲染任何内容
}; 