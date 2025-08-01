# Google AdSense 设置指南

## 概述

本指南将帮助您在 Recipe Easy 项目中正确配置和集成 Google AdSense。

## 📋 前置要求

1. **Google AdSense 账户**
   - 访问 [Google AdSense](https://www.google.com/adsense)
   - 创建账户并完成网站验证
   - 等待 Google 审核通过

2. **网站要求**
   - 网站必须已部署到生产环境
   - 网站内容必须符合 AdSense 政策
   - 网站必须有足够的原创内容

## 🔧 配置步骤

### 1. 获取 AdSense 代码

1. 登录 [Google AdSense](https://www.google.com/adsense)
2. 进入 **"广告"** → **"概览"**
3. 点击 **"创建新广告单元"**
4. 选择广告类型和格式
5. 复制生成的广告代码

### 2. 更新环境变量

在 `.env.local` 文件中添加：

```bash
# Google AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-google
```

**注意**：
- `ca-pub-XXXXXXXXXX` 替换为您的发布商 ID
- `ca-google` 是默认的客户端 ID

### 3. 配置广告单元

在 `lib/adsense.ts` 中更新广告单元配置：

```typescript
export const AD_UNITS = {
  BANNER: {
    id: 'banner-ad',
    adSlot: '1234567890', // 替换为您的广告单元 ID
    format: 'auto',
    responsive: true,
    style: { display: 'block', textAlign: 'center' }
  },
  // ... 其他广告单元
}
```

### 4. 在页面中使用广告

#### 方法 1: 使用页面包装器

```tsx
import { PageWithAds } from '@/components/adsense/ad-layout'

export default function MyPage() {
  return (
    <PageWithAds 
      adConfig={{
        showBanner: true,
        showContent: true,
        showFooter: true,
        showSidebar: false
      }}
    >
      {/* 页面内容 */}
    </PageWithAds>
  )
}
```

#### 方法 2: 使用单个广告组件

```tsx
import { BannerAd, ContentAd, SidebarAd } from '@/components/adsense/adsense-ad'

export default function MyPage() {
  return (
    <div>
      <BannerAd />
      {/* 页面内容 */}
      <ContentAd />
      <SidebarAd />
    </div>
  )
}
```

## 📍 推荐的广告位置

### 1. 首页
- **顶部横幅**: 页面顶部
- **内容中**: 在特色功能和菜谱展示之间
- **页脚**: 页面底部

### 2. 菜谱详情页
- **侧边栏**: 右侧边栏
- **内容中**: 在菜谱步骤之间
- **底部**: 菜谱结束后

### 3. 用户仪表板
- **顶部**: 仪表板顶部
- **侧边栏**: 左侧导航栏

## ⚠️ 重要注意事项

### 1. 广告政策合规
- 确保广告不会干扰用户体验
- 不要在同一页面放置过多广告
- 遵守 AdSense 的广告位置政策

### 2. 性能优化
- 广告加载不应影响页面性能
- 使用异步加载广告脚本
- 在开发环境中显示占位符

### 3. 响应式设计
- 确保广告在不同设备上正常显示
- 使用响应式广告格式
- 测试移动端广告显示

### 4. 用户体验
- 不要将广告放在关键功能附近
- 确保广告不会遮挡重要内容
- 提供关闭广告的选项（如果适用）

## 🔍 测试和验证

### 1. 开发环境测试
```bash
npm run dev
```
在开发环境中，广告会显示为占位符。

### 2. 生产环境测试
1. 部署到生产环境
2. 访问网站并检查广告显示
3. 使用 AdSense 的广告检查工具

### 3. 验证步骤
- [ ] 广告正确显示
- [ ] 广告响应式设计正常
- [ ] 页面性能未受影响
- [ ] 符合 AdSense 政策

## 📊 监控和分析

### 1. AdSense 控制台
- 监控广告收入
- 查看广告性能数据
- 分析用户点击率

### 2. 网站分析
- 监控页面加载时间
- 分析用户行为
- 优化广告位置

## 🚨 常见问题

### 1. 广告不显示
**可能原因**：
- 环境变量配置错误
- 广告单元 ID 不正确
- 网站未通过 AdSense 审核

**解决方案**：
1. 检查环境变量配置
2. 验证广告单元 ID
3. 确认网站审核状态

### 2. 广告影响页面性能
**解决方案**：
1. 使用异步加载
2. 优化广告位置
3. 减少广告数量

### 3. 移动端显示问题
**解决方案**：
1. 使用响应式广告
2. 测试不同设备
3. 调整广告大小

## 📈 优化建议

### 1. 广告位置优化
- 测试不同的广告位置
- 分析点击率数据
- 优化高转化位置

### 2. 内容优化
- 增加高质量内容
- 提高用户参与度
- 增加页面浏览量

### 3. 用户体验优化
- 确保广告不影响功能
- 提供良好的移动端体验
- 优化页面加载速度

## 📞 技术支持

如果遇到问题：

1. **查看 AdSense 帮助中心**
2. **检查 Google AdSense 论坛**
3. **联系 AdSense 支持团队**
4. **查看项目 GitHub Issues**

---

**祝您 AdSense 集成顺利！** 🚀

*最后更新: 2024年12月* 