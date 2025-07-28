# Recipe Easy 快速参考指南

## 🚀 快速开始

### 安装和运行
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

# 查看数据库
npx wrangler d1 execute recipe-database --local --command="SELECT * FROM recipes;"
```

### 部署
```bash
# 构建项目
npm run build

# 部署 Worker
npm run worker:deploy
```

## 📁 重要文件位置

### 核心文件
- **主页**: `app/[locale]/page.tsx`
- **布局**: `app/layout.tsx`
- **全局样式**: `app/globals.css`
- **类型定义**: `lib/types.ts`
- **配置**: `lib/config.ts`

### API 端点
- **菜谱生成**: `app/api/generate-recipe/`
- **图片生成**: `app/api/generate-image/`
- **菜谱管理**: `app/api/recipes/`
- **食材管理**: `app/api/ingredients/`
- **菜系管理**: `app/api/cuisines/`

### 服务层
- **菜谱服务**: `lib/services/recipe-service.ts`
- **图片服务**: `lib/services/image-service.ts`
- **数据库**: `lib/database/d1.ts`

### 组件
- **UI 组件**: `components/ui/`
- **布局组件**: `components/layout/`
- **认证组件**: `components/auth/`
- **管理组件**: `components/admin/`

## 🔧 常用开发命令

### 开发
```bash
npm run dev          # 启动 Next.js 开发服务器
npm run worker:dev   # 启动 Cloudflare Worker
npm run dev:all      # 同时启动前端和 Worker
```

### 构建和部署
```bash
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run worker:deploy # 部署 Worker
```

### 代码质量
```bash
npm run lint         # 运行 ESLint
```

### 数据库
```bash
# 本地数据库操作
npx wrangler d1 execute recipe-database --local --file=./schema.sql

# 生产数据库操作
npx wrangler d1 execute recipe-database --file=./schema.sql
```

## 🌐 环境变量

### 必需的环境变量
```env
# Cloudflare API URL
NEXT_PUBLIC_CLOUDFLARE_API_URL=http://localhost:8787

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Replicate API Token
REPLICATE_API_TOKEN=your_replicate_token
```

### 可选的环境变量
```env
# Supabase (如果使用)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 数据类型快速参考

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

## 🎨 样式指南

### Tailwind CSS 类名
```css
/* 常用布局类 */
flex items-center justify-between
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
container mx-auto px-4

/* 常用间距类 */
p-4 m-2 gap-4 space-y-4

/* 常用颜色类 */
bg-white dark:bg-gray-900
text-gray-900 dark:text-white
border-gray-200 dark:border-gray-700

/* 常用状态类 */
hover:bg-gray-100 dark:hover:bg-gray-800
focus:ring-2 focus:ring-blue-500
disabled:opacity-50
```

### 主题切换
```typescript
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()

// 切换主题
setTheme(theme === 'dark' ? 'light' : 'dark')
```

## 🔌 API 使用示例

### 生成菜谱
```typescript
const response = await fetch('/api/generate-recipe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredients: ['土豆', '胡萝卜'],
    servings: 4,
    cookingTime: '30分钟',
    difficulty: 'easy',
    cuisine: '中餐'
  })
})
```

### 生成图片
```typescript
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '美味的红烧肉',
    model: 'sdxl'
  })
})
```

## 🗄 数据库表结构

### 主要表
```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 菜谱表
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  instructions TEXT,
  image_url TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 食材表
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  english_name TEXT,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 菜系表
CREATE TABLE cuisines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 常见问题

### 开发环境问题
1. **Worker 无法启动**: 检查 `wrangler.toml` 配置
2. **数据库连接失败**: 确保 D1 数据库已创建
3. **API 调用失败**: 检查环境变量配置

### 部署问题
1. **构建失败**: 检查 TypeScript 错误
2. **Worker 部署失败**: 检查 Cloudflare 配置
3. **环境变量缺失**: 确保生产环境变量已设置

### 性能问题
1. **页面加载慢**: 检查图片优化和代码分割
2. **API 响应慢**: 检查数据库查询优化
3. **内存使用高**: 检查组件渲染优化

## 📞 获取帮助

### 文档资源
- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

### 项目相关
- **GitHub 仓库**: https://github.com/nasirann/recipegenai
- **问题反馈**: 通过 GitHub Issues
- **功能请求**: 通过 GitHub Discussions

---

*此快速参考指南提供了 Recipe Easy 项目开发中最常用的信息和命令* 