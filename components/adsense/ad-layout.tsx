'use client'

import { BannerAd, ContentAd, SidebarAd, FooterAd } from './adsense-ad'

interface AdLayoutProps {
  children: React.ReactNode
  showBanner?: boolean
  showSidebar?: boolean
  showContent?: boolean
  showFooter?: boolean
  className?: string
}

export function AdLayout({ 
  children, 
  showBanner = true, 
  showSidebar = false, 
  showContent = false, 
  showFooter = true,
  className = ''
}: AdLayoutProps) {
  return (
    <div className={`ad-layout ${className}`}>
      {/* 顶部横幅广告 */}
      {showBanner && (
        <div className="w-full mb-4">
          <BannerAd />
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 主要内容 */}
        <main className={`flex-1 ${showSidebar ? 'lg:w-3/4' : 'w-full'}`}>
          {children}
          
          {/* 内容中广告 */}
          {showContent && (
            <div className="my-8">
              <ContentAd />
            </div>
          )}
        </main>
        
        {/* 侧边栏广告 */}
        {showSidebar && (
          <aside className="lg:w-1/4">
            <div className="sticky top-4">
              <SidebarAd />
            </div>
          </aside>
        )}
      </div>
      
      {/* 页脚广告 */}
      {showFooter && (
        <div className="w-full mt-8">
          <FooterAd />
        </div>
      )}
    </div>
  )
}

// 页面包装器组件
export function PageWithAds({ 
  children, 
  adConfig = {} 
}: { 
  children: React.ReactNode
  adConfig?: Partial<AdLayoutProps>
}) {
  return (
    <AdLayout {...adConfig}>
      {children}
    </AdLayout>
  )
}

// 内容区域广告组件
export function ContentAdSection({ className = '' }: { className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <ContentAd />
    </div>
  )
}

// 侧边栏广告组件
export function SidebarAdSection({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <SidebarAd />
    </div>
  )
} 