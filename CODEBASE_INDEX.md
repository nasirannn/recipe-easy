# Recipe Easy 代码库索引

## 📋 项目概述

Recipe Easy 是一个基于 AI 的智能菜谱生成和管理平台。该项目使用 Next.js 14 构建，集成了 Cloudflare D1 数据库，提供个性化的菜谱生成服务。

## 🏗 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: React Hooks
- **表单处理**: React Hook Form + Zod
- **国际化**: next-intl
- **主题**: next-themes (深色/浅色模式)

### 后端技术
- **数据库**: Cloudflare D1 (SQLite)
- **API**: Next.js API Routes
- **AI 服务**: OpenAI API, Replicate API
- **图片生成**: 支持多种 AI 图片生成模型
- **部署**: Cloudflare Workers

### 开发工具
- **构建工具**: Next.js
- **代码质量**: ESLint
- **包管理**: npm
- **开发服务器**: Wrangler (Cloudflare)

## 📁 项目结构

```
recipe-easy/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # 国际化路由
│   │   ├── page.tsx             # 主页
│   │   ├── layout.tsx           # 布局组件
│   │   ├── terms/               # 服务条款页面
│   │   └── privacy/             # 隐私政策页面
│   ├── api/                     # API 路由
│   │   ├── recipes/             # 菜谱相关 API
│   │   ├── ingredients/         # 食材相关 API
│   │   ├── cuisines/            # 菜系相关 API
│   │   ├── generate-recipe/     # AI 菜谱生成 API
│   │   ├── generate-image/      # AI 图片生成 API
│   │   └── cloudflare/          # Cloudflare 相关 API
│   ├── auth/                    # 认证相关页面
│   ├── globals.css              # 全局样式
│   └── layout.tsx               # 根布局
├── components/                   # React 组件
│   ├── ui/                      # 基础 UI 组件 (shadcn/ui)
│   ├── layout/                  # 布局组件
│   ├── auth/                    # 认证组件
│   ├── admin/                   # 管理组件
│   └── icons/                   # 图标组件
├── lib/                         # 工具库和配置
│   ├── database/                # 数据库相关
│   │   └── d1.ts               # Cloudflare D1 配置
│   ├── services/                # 服务层
│   │   ├── recipe-service.ts    # 菜谱服务
│   │   └── image-service.ts     # 图片生成服务
│   ├── hooks/                   # 自定义 React Hooks
│   ├── config.ts                # 应用配置
│   ├── types.ts                 # TypeScript 类型定义
│   ├── utils.ts                 # 工具函数
│   ├── prompts.ts               # AI 提示词
│   ├── cloudflare.ts            # Cloudflare 配置
│   └── supabase.ts              # Supabase 配置
├── messages/                    # 国际化消息文件
├── locales/                     # 语言配置
├── contexts/                    # React Context
├── hooks/                       # 全局 Hooks
├── public/                      # 静态资源
├── schema.sql                   # 数据库架构
└── 配置文件
    ├── package.json             # 项目依赖
    ├── next.config.mjs          # Next.js 配置
    ├── tailwind.config.ts       # Tailwind 配置
    ├── tsconfig.json            # TypeScript 配置
    ├── wrangler.toml            # Cloudflare Workers 配置
    └── components.json          # shadcn/ui 配置
```

## 🔧 核心功能模块

### 1. AI 菜谱生成
- **文件位置**: `app/api/generate-recipe/`
- **服务**: `lib/services/recipe-service.ts`
- **功能**: 基于用户选择的食材生成个性化菜谱
- **AI 模型**: 支持多种语言模型 (DeepSeek, QwenPlus, GPT-4o-mini)

### 2. AI 图片生成
- **文件位置**: `app/api/generate-image/`
- **服务**: `lib/services/image-service.ts`
- **功能**: 为菜谱生成精美的配图
- **AI 模型**: 支持多种图片生成模型

### 3. 数据库管理
- **文件位置**: `lib/database/d1.ts`
- **数据库**: Cloudflare D1 (SQLite)
- **架构**: `schema.sql`
- **功能**: 管理菜谱、用户、食材、菜系等数据

### 4. 用户界面
- **组件库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **主题**: 支持深色/浅色模式
- **响应式**: 移动端友好

### 5. 国际化支持
- **框架**: next-intl
- **文件**: `messages/`, `locales/`
- **支持语言**: 中文、英文

## 🚀 API 端点

### 菜谱相关
- `GET /api/recipes` - 获取菜谱列表
- `POST /api/recipes` - 创建新菜谱
- `GET /api/recipes/[id]` - 获取特定菜谱

### 食材相关
- `GET /api/ingredients` - 获取食材列表
- `POST /api/ingredients` - 添加新食材

### 菜系相关
- `GET /api/cuisines` - 获取菜系列表
- `POST /api/cuisines` - 添加新菜系

### AI 生成
- `POST /api/generate-recipe` - AI 菜谱生成
- `POST /api/generate-image` - AI 图片生成

### Cloudflare 集成
- `GET /api/cloudflare/recipes` - 从 Cloudflare 获取菜谱
- `POST /api/cloudflare/recipes` - 保存菜谱到 Cloudflare

## 📊 数据类型

### 核心接口
```typescript
// 食材
interface Ingredient {
  id: string;
  name: string;
  englishName: string;
  category?: Category;
}

// 菜谱
interface Recipe {
  id: string;
  title: string;
  description: string;
  time: number;
  servings: number;
  difficulty: string;
  ingredients: string[];
  seasoning: string[];
  instructions: string[];
  tags: string[];
  chefTips: string[];
  image?: string;
}

// 菜谱生成请求
interface RecipeGenerationRequest {
  ingredients: string[];
  servings: number;
  recipeCount?: number;
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  language?: 'en' | 'zh';
}
```

## 🔄 开发工作流

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Cloudflare Worker
npm run worker:dev

# 同时启动前端和 Worker
npm run dev:all
```

### 数据库操作
```bash
# 创建 D1 数据库
npx wrangler d1 create recipe-database

# 执行数据库架构
npx wrangler d1 execute recipe-database --local --file=./schema.sql
```

### 部署
```bash
# 构建项目
npm run build

# 部署 Worker
npm run worker:deploy
```

## 🎯 主要特性

1. **智能菜谱生成**: 基于 AI 的个性化菜谱推荐
2. **多语言支持**: 完整的中英文国际化
3. **现代化 UI**: 响应式设计，支持深色模式
4. **云原生**: 基于 Cloudflare 的服务器less架构
5. **类型安全**: 完整的 TypeScript 支持
6. **可扩展性**: 模块化设计，易于扩展

## 🔗 相关链接

- **项目仓库**: https://github.com/nasirann/recipegenai
- **技术文档**: 各模块内联文档
- **API 文档**: 见各 API 路由文件

---

*最后更新: 2024年* 