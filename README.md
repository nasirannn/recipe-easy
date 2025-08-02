# 🍳 RecipeEasy - AI智能菜谱生成器

> 基于AI的智能菜谱生成平台，让烹饪变得简单有趣。输入食材，AI为您创造美味菜谱！

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)

🌐 **在线体验**: [https://recipe-easy.com](https://recipe-easy.com)

## ✨ 核心功能

### 🎯 智能菜谱生成
- **🤖 多AI模型支持**: DeepSeek、通义千问、GPT-4o Mini
- **📝 个性化菜谱**: 基于您选择的食材智能生成
- **🌍 多语言支持**: 中文和英文双语界面
- **🎨 AI图片生成**: 支持Wanx和Flux Schnell模型生成菜品图片
- **⚡ 快速生成**: 20-120秒内完成菜谱生成

### 🛠️ 用户友好功能
- **🔍 智能食材选择**: 预设分类 + 自定义输入
- **📱 响应式设计**: 完美适配桌面端和移动端
- **🌙 主题切换**: 明暗主题自由切换
- **🔐 便捷登录**: Google OAuth + 邮箱登录
- **💎 积分系统**: 新用户免费获得100积分

### 🍽️ 菜谱特性
- **📊 详细步骤**: 清晰的烹饪步骤和技巧
- **⏱️ 时间控制**: 支持快速、中等、长时间烹饪
- **🎯 难度分级**: 简单、中等、困难三个等级
- **🌏 全球菜系**: 支持多种菜系选择
- **👨‍🍳 厨师技巧**: 每个菜谱都包含专业烹饪技巧

## 🚀 快速开始

### 无需注册，立即体验
1. 访问 [https://recipe-easy.com](https://recipe-easy.com)
2. 选择或输入您拥有的食材
3. 设置烹饪偏好（时间、难度、菜系）
4. 点击生成，等待AI创造美味菜谱

### 注册账户，解锁更多功能
- 🎨 **AI图片生成**: 为菜谱生成精美配图（消耗积分）
- 📊 **使用统计**: 查看您的积分和使用情况
- 🔐 **个人账户**: 管理您的个人信息和设置

## 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │   Supabase      │    │  Cloudflare     │
│   (前端应用)     │◄──►│   (认证+数据库)  │    │  (Worker+D1+R2) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI 服务       │    │   用户管理      │    │   文件存储      │
│ • DeepSeek      │    │ • 积分系统      │    │ • 图片存储      │
│ • 通义千问      │    │ • 使用统计      │    │ • 数据备份      │
│ • GPT-4o Mini   │    │ • 权限控制      │    │ • CDN 加速      │
│ • Wanx (图片)   │    │ • 个人资料      │    │ • 全球分发      │
│ • Flux Schnell  │    │ • 积分管理      │    │ • 高可用性      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 项目结构

```
recipe-easy/
├── app/                          # Next.js 14 App Router
│   ├── [locale]/                 # 国际化路由 (en/zh)
│   │   ├── layout.tsx           # 布局组件
│   │   ├── page.tsx             # 首页
│   │   ├── privacy/             # 隐私政策
│   │   └── terms/               # 服务条款
│   ├── api/                     # API 路由
│   │   ├── auth/                # 认证相关
│   │   ├── generate-recipe/     # 菜谱生成
│   │   ├── generate-image/      # 图片生成
│   │   ├── ingredients/         # 食材管理
│   │   ├── recipes/             # 菜谱管理
│   │   └── user-usage/          # 用户使用统计
│   ├── layout.tsx               # 根布局
│   ├── robots.ts                # SEO robots.txt
│   └── sitemap.ts               # SEO sitemap
├── components/                   # React 组件
│   ├── auth/                    # 认证组件
│   ├── layout/                  # 布局组件
│   │   └── sections/            # 页面区块
│   │       ├── hero.tsx         # 主页横幅
│   │       ├── tutorial.tsx     # 使用教程
│   │       ├── recipes.tsx      # 菜谱展示
│   │       ├── features.tsx     # 功能特性
│   │       ├── faq.tsx          # 常见问题
│   │       ├── testimonial.tsx  # 用户评价
│   │       └── footer.tsx       # 页脚
│   └── ui/                      # UI 基础组件
├── contexts/                    # React Context
├── lib/                         # 工具库
│   ├── services/                # 服务层
│   └── utils/                   # 工具函数
├── messages/                    # 国际化文件
│   ├── en.json                  # 英文翻译
│   └── zh.json                  # 中文翻译
├── public/                      # 静态资源
└── src/                         # Cloudflare Worker
    └── worker.ts                # 后端API逻辑
```

## 🛠️ 开发指南

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 本地开发
```bash
# 克隆项目
git clone https://github.com/nasirannn/recipe-easy.git
cd recipe-easy

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入必要的API密钥

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 环境变量配置
```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Worker URL
WORKER_URL=https://your-worker.your-subdomain.workers.dev

# AI 服务 API Keys
OPENAI_API_KEY=your_openai_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key

# 可选配置
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=your_clarity_id
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 部署
```bash
# 部署 Cloudflare Worker
npm run deploy

# 部署 Cloudflare Pages
npm run deploy:cf
```

## 📊 性能优化

### 前端优化
- ✅ **图片懒加载**: 提升页面加载速度
- ✅ **代码分割**: 按需加载组件
- ✅ **服务端渲染**: 更好的SEO和首屏加载
- ✅ **静态生成**: 预渲染静态页面
- ✅ **缓存策略**: 智能缓存管理

### 后端优化
- ✅ **API缓存**: 减少重复计算
- ✅ **数据库优化**: 高效查询和索引
- ✅ **CDN加速**: 全球内容分发
- ✅ **图片优化**: 自动压缩和格式转换

## 🔒 安全措施

- ✅ **输入验证**: 防止恶意输入
- ✅ **SQL注入防护**: 参数化查询
- ✅ **XSS防护**: 内容安全策略
- ✅ **CSRF防护**: 跨站请求伪造防护
- ✅ **API密钥保护**: 环境变量管理
- ✅ **用户认证**: 安全的登录系统

## 📈 监控和分析

### 用户分析
- **Google Analytics 4**: 用户行为分析
- **Microsoft Clarity**: 用户会话录制
- **Cloudflare Analytics**: 性能监控

### 性能指标
- 页面加载时间优化
- API响应时间优化
- 图片加载优化
- 移动端体验优化

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写清晰的提交信息
- 添加必要的测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Cloudflare](https://cloudflare.com/) - 云服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库
- [OpenAI](https://openai.com/) - AI 服务
- [阿里云](https://www.aliyun.com/) - 通义千问AI服务
- [Replicate](https://replicate.com/) - AI模型部署

## 📞 联系我们

- 🌐 网站: [https://recipe-easy.com](https://recipe-easy.com)
- 📧 邮箱: [annnb016@gmail.com](mailto:annnb016@gmail.com)
- 🐛 问题反馈: [GitHub Issues](https://github.com/nasirannn/recipe-easy/issues)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！

**让AI为您的烹饪之旅增添无限可能！** 🍳✨
