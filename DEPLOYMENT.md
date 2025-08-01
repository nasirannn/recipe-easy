# 🚀 Recipe Easy 部署指南

## 📋 项目概述

Recipe Easy 是一个基于 Next.js 14 的全栈菜谱生成应用，集成了 AI 驱动的菜谱生成、图片生成、用户认证等功能。

### 🏗️ 技术架构
```
前端 (Next.js 14) → API Routes → Supabase (认证) + Cloudflare Worker (数据处理)
```
- **前端**: Next.js 14 (React + TypeScript + Tailwind CSS)
- **认证**: Supabase Auth (Google OAuth + 邮箱登录)
- **数据库**: Cloudflare D1 (SQLite)
- **文件存储**: Cloudflare R2
- **AI 服务**: OpenAI GPT-4, Replicate, 通义千问
- **国际化**: next-intl
- **UI 组件**: Radix UI + Lucide Icons

## 🔧 部署前准备

### 1. 环境变量配置

创建 `.env.local` 文件：

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

# Google Analytics (可选)
NEXT_PUBLIC_GA_ID=your_ga_id

# Microsoft Clarity (可选)
NEXT_PUBLIC_CLARITY_ID=snyht181zw

# Google AdSense (可选)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-google

# 其他配置
NEXT_PUBLIC_APP_URL=https://recipe-easy.com
```

### 2. Supabase 配置

#### 创建 Supabase 项目
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 anon key

#### 配置 Google OAuth
1. 在 Supabase Dashboard → Authentication → Providers
2. 启用 Google 提供商
3. 配置 OAuth 客户端 ID 和密钥

#### 设置重定向 URL
在 Supabase Dashboard → Authentication → URL Configuration：
```
http://localhost:3000/*
http://localhost:3000/auth/callback
https://your-domain.com/*
https://your-domain.com/auth/callback
```

### 3. Google Cloud Console 配置

#### 创建 OAuth 2.0 客户端
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 配置授权重定向 URI：
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### 4. Cloudflare 配置

#### 创建 D1 数据库
```bash
# 创建数据库
wrangler d1 create recipe-easy-db

# 应用迁移
wrangler d1 migrations apply recipe-easy-db --local
wrangler d1 migrations apply recipe-easy-db --remote
```

#### 创建 R2 存储桶
```bash
# 创建存储桶
wrangler r2 bucket create recipe-images
```

#### 更新 wrangler.toml
```toml
name = "recipe-easy"
compatibility_date = "2024-03-20"
main = "src/worker.ts"

[[d1_databases]]
binding = "RECIPE_EASY_DB"
database_name = "recipe-easy-db"
database_id = "your_database_id"
preview_database_id = "your_database_id"

[[r2_buckets]]
binding = "RECIPE_IMAGES"
bucket_name = "recipe-images"
preview_bucket_name = "recipe-images"
```

## 🚀 部署步骤

### 1. 本地开发测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Cloudflare Worker (可选)
npm run dev:cf
```

### 2. 构建项目

```bash
# 构建 Next.js 应用
npm run build
```

### 3. 部署到 Cloudflare Pages

#### 方法一：通过 Cloudflare Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages → Create a project
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (如果项目在根目录)

#### 方法二：通过 Wrangler CLI
```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署 Worker
npm run deploy

# 部署 Pages (需要先配置)
wrangler pages deploy .next --project-name=recipe-easy
```

### 4. 环境变量配置

在 Cloudflare Pages Dashboard → Settings → Environment variables：

```bash
# 生产环境
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
WORKER_URL=https://your-worker.your-subdomain.workers.dev
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_token
DASHSCOPE_API_KEY=your_dashscope_api_key
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=snyht181zw
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 预览环境 (可选)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
WORKER_URL=https://your-worker.your-subdomain.workers.dev
# ... 其他变量
```

### 5. 自定义域名配置

1. 在 Cloudflare Pages → Settings → Custom domains
2. 添加自定义域名
3. 配置 DNS 记录
4. 启用 HTTPS

## 🔍 部署验证

### 1. 功能测试
- [ ] 用户注册/登录
- [ ] Google OAuth 登录
- [ ] 菜谱生成
- [ ] 图片生成
- [ ] 积分系统
- [ ] 多语言切换
- [ ] 响应式设计

### 2. 性能检查
- [ ] 页面加载速度
- [ ] API 响应时间
- [ ] 图片加载优化
- [ ] SEO 元数据

### 3. 安全验证
- [ ] HTTPS 启用
- [ ] 环境变量安全
- [ ] API 密钥保护
- [ ] 用户数据安全

## 📊 监控和分析

### 1. Cloudflare Analytics
- 页面浏览量
- 用户地理位置
- 性能指标
- 错误率

### 2. Google Analytics 4
- 用户行为分析
- 转化跟踪
- 实时数据

### 3. Microsoft Clarity
- 用户会话录制
- 热力图分析
- 性能监控

## 🚨 常见问题

### 1. 构建失败
**问题**: Next.js 构建失败
**解决方案**:
- 检查 TypeScript 错误
- 验证环境变量配置
- 确保所有依赖已安装

### 2. API 路由错误
**问题**: API 路由返回 404
**解决方案**:
- 检查 Cloudflare Worker 部署状态
- 验证 `WORKER_URL` 环境变量
- 确认 Worker 代码正确

### 3. 认证问题
**问题**: Google OAuth 登录失败
**解决方案**:
- 检查 Supabase 重定向 URL 配置
- 验证 Google Cloud Console 设置
- 确认 OAuth 客户端 ID 正确

### 4. 数据库连接问题
**问题**: D1 数据库连接失败
**解决方案**:
- 检查 `wrangler.toml` 配置
- 验证数据库 ID 正确
- 确认迁移已应用

### 5. 图片上传失败
**问题**: R2 存储桶访问错误
**解决方案**:
- 检查 R2 存储桶权限
- 验证绑定配置
- 确认 CORS 设置

## 🔄 维护和更新

### 1. 定期更新
```bash
# 更新依赖
npm update

# 检查安全漏洞
npm audit

# 重新部署
npm run build
npm run deploy
```

### 2. 数据库备份
```bash
# 备份数据库
npm run db:backup

# 恢复数据库
wrangler d1 execute recipe-easy-db --remote --file=backup.sql
```

### 3. 监控日志
- 查看 Cloudflare Workers 日志
- 监控错误率和性能
- 定期检查用户反馈

## 📞 技术支持

如果遇到部署问题：

1. **查看文档**: 参考 Cloudflare 和 Next.js 官方文档
2. **检查日志**: 查看 Cloudflare Dashboard 日志
3. **社区支持**: 在 GitHub Issues 中寻求帮助
4. **联系支持**: 通过 Cloudflare 支持渠道

---

**祝您部署顺利！** 🚀

*最后更新: 2024年12月* 