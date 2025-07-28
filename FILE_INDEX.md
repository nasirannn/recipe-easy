# Recipe Easy 文件索引

## 📁 核心应用文件

### 应用入口和配置
- `app/layout.tsx` - 根布局组件
- `app/globals.css` - 全局样式文件
- `app/favicon.svg` - 网站图标
- `next.config.mjs` - Next.js 配置文件
- `middleware.ts` - Next.js 中间件
- `i18n.ts` - 国际化配置

### 页面路由
- `app/[locale]/page.tsx` - 主页
- `app/[locale]/layout.tsx` - 本地化布局
- `app/[locale]/terms/page.tsx` - 服务条款页面
- `app/[locale]/privacy/page.tsx` - 隐私政策页面
- `app/auth/` - 认证相关页面

### API 路由
- `app/api/recipes/` - 菜谱管理 API
- `app/api/ingredients/` - 食材管理 API
- `app/api/cuisines/` - 菜系管理 API
- `app/api/generate-recipe/` - AI 菜谱生成 API
- `app/api/generate-image/` - AI 图片生成 API
- `app/api/cloudflare/` - Cloudflare 集成 API

## 🧩 组件文件

### UI 组件 (shadcn/ui)
- `components/ui/` - 基础 UI 组件库
  - 包含按钮、输入框、对话框、下拉菜单等基础组件

### 布局组件
- `components/layout/` - 页面布局组件
  - 导航栏、侧边栏、页脚等布局元素

### 功能组件
- `components/auth/` - 认证相关组件
- `components/admin/` - 管理后台组件
- `components/icons/` - 图标组件

## 🔧 工具库文件

### 类型定义
- `lib/types.ts` - 核心 TypeScript 类型定义
  - `Ingredient` - 食材接口
  - `Recipe` - 菜谱接口
  - `RecipeGenerationRequest` - 菜谱生成请求接口
  - `RecipeFormData` - 菜谱表单数据接口

### 配置文件
- `lib/config.ts` - 应用配置
- `lib/cloudflare.ts` - Cloudflare 配置
- `lib/supabase.ts` - Supabase 配置

### 服务层
- `lib/services/recipe-service.ts` - 菜谱服务
  - AI 菜谱生成逻辑
  - 菜谱数据处理
- `lib/services/image-service.ts` - 图片生成服务
  - AI 图片生成逻辑
  - 多种图片模型支持

### 数据库
- `lib/database/d1.ts` - Cloudflare D1 数据库配置
  - 数据库连接
  - 查询方法
- `schema.sql` - 数据库架构定义

### 工具函数
- `lib/utils.ts` - 通用工具函数
- `lib/prompts.ts` - AI 提示词模板
- `lib/hooks/` - 自定义 React Hooks

## 📦 配置文件

### 项目配置
- `package.json` - 项目依赖和脚本
- `package-lock.json` - 依赖锁定文件
- `tsconfig.json` - TypeScript 配置
- `tailwind.config.ts` - Tailwind CSS 配置
- `postcss.config.mjs` - PostCSS 配置
- `components.json` - shadcn/ui 配置

### 部署配置
- `wrangler.toml` - Cloudflare Workers 配置
- `.wrangler/` - Wrangler 本地开发文件

### 代码质量
- `.eslintrc.json` - ESLint 配置
- `.gitignore` - Git 忽略文件
- `.gitattributes` - Git 属性文件

## 🌐 国际化文件

### 消息文件
- `messages/` - 国际化消息文件
  - 包含中英文翻译

### 语言配置
- `locales/` - 语言配置文件

## 🎨 样式文件

### 全局样式
- `app/globals.css` - 全局 CSS 样式
  - Tailwind CSS 导入
  - 自定义样式变量
  - 深色模式支持

## 📄 文档文件

### 项目文档
- `README.md` - 项目说明文档
- `LICENSE` - 开源许可证

## 🔍 开发工具文件

### 类型声明
- `next-env.d.ts` - Next.js 类型声明
- `src/index.ts` - 主要源代码文件

## 📊 数据库文件

### 架构定义
- `schema.sql` - 数据库表结构
  - 用户表
  - 菜谱表
  - 食材表
  - 菜系表
  - 关联表

## 🚀 部署文件

### Cloudflare 配置
- `wrangler.toml` - Workers 配置
- `.wrangler/` - 本地开发环境

## 📁 静态资源

### 公共资源
- `public/` - 静态资源目录
  - 图片、字体、图标等

## 🔧 开发脚本

### NPM 脚本 (package.json)
- `dev` - 启动开发服务器
- `build` - 构建生产版本
- `start` - 启动生产服务器
- `lint` - 代码检查
- `worker:dev` - 启动 Cloudflare Worker 开发环境
- `worker:deploy` - 部署 Cloudflare Worker
- `dev:all` - 同时启动前端和 Worker

## 📋 文件功能总结

### 核心功能文件
1. **AI 菜谱生成**: `lib/services/recipe-service.ts`, `app/api/generate-recipe/`
2. **AI 图片生成**: `lib/services/image-service.ts`, `app/api/generate-image/`
3. **数据库管理**: `lib/database/d1.ts`, `schema.sql`
4. **用户界面**: `components/`, `app/[locale]/`
5. **API 接口**: `app/api/` 目录下的所有文件
6. **类型安全**: `lib/types.ts`
7. **国际化**: `messages/`, `locales/`, `i18n.ts`

### 配置文件
1. **Next.js**: `next.config.mjs`, `middleware.ts`
2. **TypeScript**: `tsconfig.json`
3. **样式**: `tailwind.config.ts`, `postcss.config.mjs`
4. **部署**: `wrangler.toml`
5. **代码质量**: `.eslintrc.json`

### 开发工具
1. **包管理**: `package.json`, `package-lock.json`
2. **Git**: `.gitignore`, `.gitattributes`
3. **类型声明**: `next-env.d.ts`

---

*此索引涵盖了 Recipe Easy 项目中的所有重要文件及其功能* 