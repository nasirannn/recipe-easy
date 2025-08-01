'use client'

import { useEffect, useRef } from 'react'
import { AD_UNITS, isDevelopment, initializeAdSense, pushAd } from '@/lib/adsense'

interface AdSenseAdProps {
  type: keyof typeof AD_UNITS
  className?: string
  style?: React.CSSProperties
}

export function AdSenseAd({ type, className = '', style = {} }: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const adUnit = AD_UNITS[type]

  useEffect(() => {
    // 在开发环境中不显示广告
    if (isDevelopment) {
      return
    }

    // 初始化 AdSense
    initializeAdSense()

    // 等待 AdSense 加载完成后推送广告
    const checkAdSense = () => {
      if (adRef.current && (window as any).adsbygoogle) {
        pushAd(adRef.current)
      } else {
        // 如果还没加载完成，继续等待
        setTimeout(checkAdSense, 100)
      }
    }

    checkAdSense()
  }, [type])

  // 在开发环境中显示占位符
  if (isDevelopment) {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg p-4 text-center text-gray-600 ${className}`}
        style={{ ...adUnit.style, ...style } as React.CSSProperties}
      >
        <div className="text-sm font-medium">AdSense Ad Placeholder</div>
        <div className="text-xs mt-1">{type.toUpperCase()} - {adUnit.adSlot}</div>
      </div>
    )
  }

  return (
    <div 
      ref={adRef}
      className={`adsense-ad ${className}`}
      style={{ ...adUnit.style, ...style } as React.CSSProperties}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adUnit.adSlot}
        data-ad-slot={adUnit.adSlot}
        data-ad-format={adUnit.format}
        data-full-width-responsive={adUnit.responsive}
      />
    </div>
  )
}

// 横幅广告组件
export function BannerAd({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AdSenseAd type="BANNER" className={className} style={style} />
}

// 侧边栏广告组件
export function SidebarAd({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AdSenseAd type="SIDEBAR" className={className} style={style} />
}

// 内容广告组件
export function ContentAd({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AdSenseAd type="CONTENT" className={className} style={style} />
}

// 页脚广告组件
export function FooterAd({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <AdSenseAd type="FOOTER" className={className} style={style} />
} 