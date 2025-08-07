"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export const AnchorHandler = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 检查URL中是否有锚点
    const hash = window.location.hash;
    
    if (hash) {
      // 移除#号
      const elementId = hash.substring(1);
      const element = document.getElementById(elementId);
      
      if (element) {
        // 延迟执行以确保页面完全加载
        setTimeout(() => {
          const elementRect = element.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          
          window.scrollTo({
            top: absoluteElementTop - 100, // 留一些顶部空间
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [searchParams]);

  return null; // 这个组件不渲染任何内容
}; 