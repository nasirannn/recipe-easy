# Recipe Easy 技术栈索引

## 🏗 核心技术栈

### 前端框架
- **Next.js 14** - React 全栈框架，使用 App Router
- **React 18** - 用户界面库
- **TypeScript 5** - 类型安全的 JavaScript

### 样式和 UI
- **Tailwind CSS 3.4.1** - 实用优先的 CSS 框架
- **shadcn/ui** - 基于 Radix UI 的组件库
- **Radix UI** - 无样式的可访问组件
- **Lucide React** - 图标库
- **next-themes** - 主题切换 (深色/浅色模式)
- **tailwindcss-animate** - Tailwind 动画插件
- **tailwind-merge** - Tailwind 类名合并工具

### 表单和验证
- **React Hook Form 7.52.2** - 高性能表单库
- **@hookform/resolvers 3.9.0** - 表单验证解析器
- **Zod 3.23.8** - TypeScript 优先的模式验证

### 国际化
- **next-intl 4.3.4** - Next.js 国际化解决方案

### 数据库和存储
- **Cloudflare D1** - 边缘 SQLite 数据库
- **@supabase/supabase-js 2.52.0** - Supabase 客户端
- **@supabase/auth-helpers-nextjs 0.10.0** - Next.js 认证助手

### AI 和机器学习
- **OpenAI 5.10.1** - OpenAI API 客户端
- **Replicate 1.0.1** - AI 模型部署平台

### HTTP 客户端
- **Axios 1.11.0** - HTTP 客户端库

### 工具库
- **clsx 2.1.1** - 条件类名工具
- **class-variance-authority 0.7.0** - 组件变体管理
- **remark 15.0.1** - Markdown 处理器
- **remark-html 16.0.1** - Markdown 转 HTML

### UI 组件 (Radix UI)
- **@radix-ui/react-accordion** - 手风琴组件
- **@radix-ui/react-avatar** - 头像组件
- **@radix-ui/react-collapsible** - 可折叠组件
- **@radix-ui/react-dialog** - 对话框组件
- **@radix-ui/react-dropdown-menu** - 下拉菜单
- **@radix-ui/react-label** - 标签组件
- **@radix-ui/react-navigation-menu** - 导航菜单
- **@radix-ui/react-popover** - 弹出框组件
- **@radix-ui/react-progress** - 进度条组件
- **@radix-ui/react-radio-group** - 单选按钮组
- **@radix-ui/react-scroll-area** - 滚动区域
- **@radix-ui/react-select** - 选择器组件
- **@radix-ui/react-separator** - 分隔符组件
- **@radix-ui/react-slider** - 滑块组件
- **@radix-ui/react-slot** - 插槽组件
- **@radix-ui/react-tabs** - 标签页组件
- **@radix-ui/react-tooltip** - 工具提示组件

### 其他 UI 组件
- **@devnomic/marquee** - 跑马灯组件
- **embla-carousel-react** - 轮播图组件
- **sonner** - 轻量级 toast 通知

## 🛠 开发工具

### 构建工具
- **Next.js** - 构建和开发服务器
- **PostCSS** - CSS 后处理器
- **TypeScript** - 类型检查和编译

### 代码质量
- **ESLint 8** - JavaScript 代码检查
- **eslint-config-next** - Next.js ESLint 配置

### 部署和云服务
- **Wrangler 4.25.1** - Cloudflare Workers 开发工具
- **@cloudflare/workers-types** - Cloudflare Workers 类型定义

### 开发工具
- **Concurrently 9.2.0** - 并行运行命令
- **@types/node** - Node.js 类型定义
- **@types/react** - React 类型定义
- **@types/react-dom** - React DOM 类型定义

## 📦 依赖包详细说明

### 生产依赖 (dependencies)

#### 核心框架
```json
{
  "next": "^14.2.3",
  "react": "^18",
  "react-dom": "^18"
}
```

#### 类型安全
```json
{
  "typescript": "^5"
}
```

#### 样式和 UI
```json
{
  "tailwindcss": "^3.4.1",
  "@tailwindcss/typography": "^0.5.16",
  "tailwindcss-animate": "^1.0.7",
  "tailwind-merge": "^2.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1"
}
```

#### Radix UI 组件
```json
{
  "@radix-ui/react-accordion": "^1.1.2",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-collapsible": "^1.0.3",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.1.15",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-navigation-menu": "^1.1.4",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-radio-group": "^1.3.7",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "@radix-ui/react-select": "^2.1.1",
  "@radix-ui/react-separator": "^1.0.3",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-tooltip": "^1.2.7"
}
```

#### 表单和验证
```json
{
  "react-hook-form": "^7.52.2",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8"
}
```

#### 国际化
```json
{
  "next-intl": "^4.3.4"
}
```

#### 主题
```json
{
  "next-themes": "^0.3.0"
}
```

#### 图标和 UI 组件
```json
{
  "lucide-react": "^0.383.0",
  "@devnomic/marquee": "^1.0.2",
  "embla-carousel-react": "^8.1.3",
  "sonner": "^2.0.6"
}
```

#### 数据库和认证
```json
{
  "@supabase/supabase-js": "^2.52.0",
  "@supabase/auth-helpers-nextjs": "^0.10.0"
}
```

#### AI 服务
```json
{
  "openai": "^5.10.1",
  "replicate": "^1.0.1"
}
```

#### HTTP 客户端
```json
{
  "axios": "^1.11.0"
}
```

#### 工具库
```json
{
  "remark": "^15.0.1",
  "remark-html": "^16.0.1"
}
```

### 开发依赖 (devDependencies)

#### 类型定义
```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "@cloudflare/workers-types": "^4.20250723.0"
}
```

#### 代码质量
```json
{
  "eslint": "^8",
  "eslint-config-next": "14.2.3"
}
```

#### 构建工具
```json
{
  "postcss": "^8"
}
```

#### 开发工具
```json
{
  "concurrently": "^9.2.0",
  "wrangler": "^4.25.1"
}
```

## 🔧 技术栈架构

### 前端架构
```
Next.js 14 (App Router)
├── React 18
├── TypeScript 5
├── Tailwind CSS
├── shadcn/ui (Radix UI)
├── React Hook Form + Zod
├── next-intl (国际化)
└── next-themes (主题)
```

### 后端架构
```
Next.js API Routes
├── Cloudflare D1 (数据库)
├── OpenAI API (AI 服务)
├── Replicate API (图片生成)
└── Supabase (认证)
```

### 部署架构
```
Cloudflare Workers
├── Cloudflare D1
├── Cloudflare R2 (可选)
└── Cloudflare CDN
```

## 🎯 技术选择理由

### 为什么选择 Next.js 14?
- **App Router**: 现代化的路由系统
- **服务器组件**: 更好的性能和 SEO
- **API Routes**: 内置后端 API 支持
- **TypeScript**: 原生支持

### 为什么选择 Cloudflare D1?
- **边缘数据库**: 全球低延迟
- **SQLite 兼容**: 熟悉的 SQL 语法
- **成本效益**: 按使用量计费
- **集成简单**: 与 Workers 无缝集成

### 为什么选择 shadcn/ui?
- **可定制**: 完全可定制的组件
- **可访问性**: 基于 Radix UI
- **现代化**: 支持最新的 React 特性
- **类型安全**: 完整的 TypeScript 支持

### 为什么选择 Tailwind CSS?
- **开发效率**: 快速样式开发
- **一致性**: 设计系统一致性
- **性能**: 生产环境自动优化
- **可维护性**: 实用优先的方法

## 📊 性能优化

### 前端优化
- **Next.js 14**: 自动代码分割和优化
- **React 18**: 并发特性和 Suspense
- **Tailwind CSS**: 生产环境自动清理未使用样式
- **TypeScript**: 编译时错误检查

### 后端优化
- **Cloudflare Workers**: 边缘计算
- **Cloudflare D1**: 边缘数据库
- **API 缓存**: 智能缓存策略

### 部署优化
- **Cloudflare CDN**: 全球内容分发
- **自动压缩**: 静态资源压缩
- **HTTP/3**: 最新网络协议支持

---

*此技术栈索引涵盖了 Recipe Easy 项目使用的所有技术和依赖包* 