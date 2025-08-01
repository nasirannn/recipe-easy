# 🍳 Recipe Easy - AI 智能菜谱生成器

> 基于 AI 的智能菜谱生成应用，让烹饪变得简单有趣

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)

## ✨ 功能特性

### 🎯 核心功能
- **🤖 AI 菜谱生成**: 基于食材智能生成个性化菜谱
- **🎨 AI 图片生成**: 为菜谱生成精美的配图
- **📱 响应式设计**: 完美适配桌面端和移动端
- **🌍 多语言支持**: 支持中文和英文
- **🎨 主题切换**: 明暗主题自由切换
- **🔐 用户认证**: Google OAuth + 邮箱登录
- **💎 积分系统**: 智能积分管理和使用

### 🛠️ 技术特性
- **⚡ 高性能**: Next.js 14 App Router + 服务端渲染
- **🔒 安全可靠**: Supabase 认证 + 数据验证
- **📊 数据分析**: Google Analytics + Microsoft Clarity
- **💰 广告集成**: Google AdSense 支持
- **🔍 SEO 优化**: 完整的 SEO 配置和元数据
- **📈 实时监控**: 用户行为分析和性能监控

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
│ • OpenAI GPT-4  │    │ • 积分系统      │    │ • 图片存储      │
│ • Replicate     │    │ • 使用统计      │    │ • 数据备份      │
│ • 通义千问      │    │ • 权限控制      │    │ • CDN 加速      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 1. 克隆项目
```bash
git clone https://github.com/your-username/recipe-easy.git
cd recipe-easy
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env.local` 并配置：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Worker URL
WORKER_URL=https://your-worker.your-subdomain.workers.dev

# AI 服务 API Keys
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_token
DASHSCOPE_API_KEY=your_dashscope_api_key

# 可选配置
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=snyht181zw
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. 启动开发服务器
```bash
# 启动 Next.js 开发服务器
npm run dev

# 启动 Cloudflare Worker (可选)
npm run dev:cf
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
recipe-easy/
├── app/                          # Next.js 14 App Router
│   ├── [locale]/                 # 国际化路由
│   │   ├── layout.tsx           # 布局组件
│   │   ├── page.tsx             # 首页
│   │   ├── privacy/             # 隐私政策页面
│   │   └── terms/               # 服务条款页面
│   ├── api/                     # API 路由
│   │   ├── auth/                # 认证相关 API
│   │   ├── generate-recipe/     # 菜谱生成 API
│   │   ├── generate-image/      # 图片生成 API
│   │   └── ...                  # 其他 API
│   ├── layout.tsx               # 根布局
│   ├── robots.ts                # SEO robots.txt
│   └── sitemap.ts               # SEO sitemap
├── components/                   # React 组件
│   ├── adsense/                 # Google AdSense 组件
│   ├── analytics/               # 分析组件
│   ├── auth/                    # 认证组件
│   ├── layout/                  # 布局组件
│   │   └── sections/            # 页面区块组件
│   └── ui/                      # UI 基础组件
├── contexts/                    # React Context
├── hooks/                       # 自定义 Hooks
├── lib/                         # 工具库
│   ├── services/                # 服务层
│   ├── types/                   # TypeScript 类型
│   └── utils/                   # 工具函数
├── messages/                    # 国际化文件
├── public/                      # 静态资源
├── src/                         # Cloudflare Worker
└── docs/                        # 文档
```

## 🛠️ 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### 提交规范
```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 分支管理
- `main`: 主分支，用于生产环境
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

## 📊 性能优化

### 前端优化
- ✅ 图片懒加载和优化
- ✅ 代码分割和动态导入
- ✅ 服务端渲染 (SSR)
- ✅ 静态生成 (SSG)
- ✅ 缓存策略优化

### 后端优化
- ✅ API 响应缓存
- ✅ 数据库查询优化
- ✅ CDN 加速
- ✅ 图片压缩和格式优化

## 🔒 安全措施

- ✅ 输入验证和清理
- ✅ SQL 注入防护
- ✅ XSS 攻击防护
- ✅ CSRF 防护
- ✅ 环境变量安全
- ✅ API 密钥保护

## 📈 监控和分析

### 用户分析
- **Google Analytics 4**: 用户行为分析
- **Microsoft Clarity**: 用户会话录制
- **Cloudflare Analytics**: 性能监控

### 性能监控
- 页面加载时间
- API 响应时间
- 错误率统计
- 用户满意度

## 🚀 部署

### Cloudflare Pages 部署
1. 连接 GitHub 仓库
2. 配置构建设置
3. 设置环境变量
4. 配置自定义域名

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发环境设置
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Cloudflare](https://cloudflare.com/) - 云服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Radix UI](https://www.radix-ui.com/) - UI 组件库
- [OpenAI](https://openai.com/) - AI 服务
- [Replicate](https://replicate.com/) - AI 模型部署

## 📞 联系我们

- 🌐 网站: [https://recipe-easy.com](https://recipe-easy.com)
- 📧 邮箱: [annnb016@gmail.com](mailto:annnb016@gmail.com)
- 🐛 问题反馈: [GitHub Issues](https://github.com/nasirannn/recipe-easy/issues)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！
