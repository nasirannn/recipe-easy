# RecipeEasy 技术架构文档

## 系统架构概览

RecipeEasy采用现代化的云原生架构，基于Cloudflare的边缘计算平台构建，提供高性能、高可用的AI菜谱生成服务。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户浏览器     │    │  移动端应用     │    │   第三方API     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Cloudflare CDN        │
                    │   (全球边缘节点)          │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Cloudflare Pages       │
                    │   (前端静态托管)          │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │  Cloudflare Workers      │
                    │   (后端API服务)           │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│  Cloudflare D1    │  │  Cloudflare R2    │  │   Supabase Auth   │
│   (数据库)        │  │  (对象存储)       │  │   (用户认证)      │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

## 前端技术栈

### 核心框架
- **Next.js 14**: 使用App Router架构，支持服务端渲染(SSR)和静态生成(SSG)
- **TypeScript**: 提供类型安全和更好的开发体验
- **React 18**: 使用最新的React特性，包括并发渲染

### UI/UX框架
- **Tailwind CSS**: 原子化CSS框架，快速构建响应式界面
- **Radix UI**: 无样式的可访问性组件库
- **shadcn/ui**: 基于Radix UI的预制组件库
- **Lucide React**: 现代化的图标库

### 状态管理
- **React Context**: 用于全局状态管理（如用户认证状态）
- **useState/useEffect**: 本地状态管理
- **React Query**: 服务端状态管理（可选）

### 国际化
- **next-intl**: 多语言支持，支持中英文切换
- **动态路由**: 基于locale的路由结构 `/[locale]/`

### 构建和部署
- **Vite**: 快速的构建工具
- **Cloudflare Pages**: 边缘部署平台
- **自动CI/CD**: GitHub Actions集成

## 后端技术栈

### 运行时环境
- **Cloudflare Workers**: 边缘计算平台，全球分布式部署
- **JavaScript/TypeScript**: 运行时语言
- **Wrangler CLI**: 开发和部署工具

### 数据库
- **Cloudflare D1**: 基于SQLite的分布式数据库
- **SQL**: 关系型数据库查询语言
- **数据库迁移**: 版本控制和迁移管理

### 存储服务
- **Cloudflare R2**: 对象存储服务，兼容S3 API
- **图片处理**: 自动图片优化和格式转换
- **CDN加速**: 全球内容分发网络

### 认证服务
- **Supabase Auth**: 用户认证和授权
- **JWT Token**: 无状态认证机制
- **OAuth集成**: 支持第三方登录

## 数据库设计

### 核心表结构

#### 1. 菜谱表 (recipes)
```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tags TEXT, -- JSON格式存储标签
  difficulty TEXT DEFAULT 'easy',
  cook_time INTEGER DEFAULT 30,
  servings INTEGER DEFAULT 4,
  cuisine_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. 菜谱国际化表 (recipes_i18n)
```sql
CREATE TABLE recipes_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT,
  description TEXT,
  ingredients TEXT, -- JSON格式存储食材
  seasoning TEXT,   -- JSON格式存储调料
  instructions TEXT, -- JSON格式存储步骤
  chef_tips TEXT,   -- JSON格式存储小贴士
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  UNIQUE(recipe_id, language_code)
);
```

#### 3. 菜系表 (cuisines)
```sql
CREATE TABLE cuisines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. 菜系国际化表 (cuisines_i18n)
```sql
CREATE TABLE cuisines_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuisine_id INTEGER NOT NULL,
  language_code TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id),
  UNIQUE(cuisine_id, language_code)
);
```

#### 5. 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. 用户使用记录表 (user_usage)
```sql
CREATE TABLE user_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'generate_recipe', 'view_recipe', etc.
  recipe_id INTEGER,
  ingredients TEXT, -- JSON格式存储使用的食材
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

### 索引优化
```sql
-- 菜谱表索引
CREATE INDEX idx_recipes_cuisine_id ON recipes(cuisine_id);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);

-- 国际化表索引
CREATE INDEX idx_recipes_i18n_recipe_lang ON recipes_i18n(recipe_id, language_code);
CREATE INDEX idx_cuisines_i18n_cuisine_lang ON cuisines_i18n(cuisine_id, language_code);

-- 用户使用记录索引
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_created_at ON user_usage(created_at);
```

## API设计

### RESTful API规范

#### 1. 菜谱相关API

**获取菜谱列表**
```
GET /api/recipes
Query Parameters:
- limit: 返回数量限制 (默认: 8)
- offset: 偏移量 (默认: 0)
- lang: 语言代码 (zh/en)
- cuisine_id: 菜系ID (可选)
- difficulty: 难度等级 (可选)

Response:
{
  "success": true,
  "results": [
    {
      "id": 1,
      "title": "土豆炖牛肉",
      "description": "经典的家常菜...",
      "image_url": "https://...",
      "tags": ["家常菜", "炖菜"],
      "difficulty": "easy",
      "cook_time": 45,
      "servings": 4,
      "cuisine": {
        "id": 1,
        "name": "中式"
      }
    }
  ],
  "total": 100
}
```

**获取菜谱详情**
```
GET /api/recipes/{id}
Query Parameters:
- lang: 语言代码 (zh/en)

Response:
{
  "success": true,
  "recipe": {
    "id": 1,
    "title": "土豆炖牛肉",
    "description": "经典的家常菜...",
    "image_url": "https://...",
    "ingredients": ["土豆", "牛肉", "胡萝卜"],
    "seasoning": ["盐", "酱油", "料酒"],
    "instructions": ["步骤1", "步骤2", "步骤3"],
    "chef_tips": ["小贴士1", "小贴士2"],
    "difficulty": "easy",
    "cook_time": 45,
    "servings": 4,
    "cuisine": {
      "id": 1,
      "name": "中式"
    }
  }
}
```

**生成菜谱**
```
POST /api/generate-recipe
Content-Type: application/json

Request Body:
{
  "ingredients": ["土豆", "胡萝卜", "洋葱"],
  "language": "zh",
  "difficulty": "easy",
  "cuisine_id": 1
}

Response:
{
  "success": true,
  "recipe": {
    // 生成的菜谱详情
  }
}
```

#### 2. 菜系相关API

**获取菜系列表**
```
GET /api/cuisines
Query Parameters:
- lang: 语言代码 (zh/en)

Response:
{
  "success": true,
  "cuisines": [
    {
      "id": 1,
      "name": "中式"
    },
    {
      "id": 2,
      "name": "意式"
    }
  ]
}
```

#### 3. 用户相关API

**获取用户使用统计**
```
GET /api/user-usage
Headers:
- Authorization: Bearer {token}

Response:
{
  "success": true,
  "usage": {
    "total_generated": 25,
    "this_month": 8,
    "favorite_cuisines": ["中式", "意式"],
    "common_ingredients": ["土豆", "胡萝卜"]
  }
}
```

### 错误处理
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "无效的输入参数",
    "details": {
      "field": "ingredients",
      "issue": "食材列表不能为空"
    }
  }
}
```

## 部署架构

### 开发环境
```
本地开发 → Wrangler Dev → Cloudflare Workers (本地)
                    ↓
            Cloudflare D1 (本地SQLite)
```

### 生产环境
```
用户请求 → Cloudflare CDN (全球边缘节点)
                    ↓
            Cloudflare Pages (前端静态文件)
                    ↓
            Cloudflare Workers (API服务)
                    ↓
            Cloudflare D1 (分布式数据库)
                    ↓
            Cloudflare R2 (对象存储)
```

### CI/CD流程
```
代码提交 → GitHub Actions → 构建测试 → 部署到Cloudflare
```

## 性能优化

### 前端优化
- **代码分割**: 按路由和组件进行代码分割
- **图片优化**: 使用Next.js Image组件自动优化
- **缓存策略**: 合理的缓存策略减少重复请求
- **预加载**: 关键资源预加载提升用户体验

### 后端优化
- **数据库索引**: 优化查询性能
- **连接池**: 数据库连接复用
- **缓存**: Redis缓存热点数据
- **CDN**: 静态资源全球分发

### 监控和日志
- **性能监控**: 实时监控API响应时间
- **错误追踪**: 详细的错误日志和堆栈信息
- **用户行为**: 用户操作行为分析
- **系统健康**: 系统资源使用情况监控

## 安全考虑

### 数据安全
- **HTTPS**: 全站HTTPS加密
- **数据加密**: 敏感数据加密存储
- **SQL注入防护**: 参数化查询
- **XSS防护**: 输入输出过滤

### 访问控制
- **JWT认证**: 无状态用户认证
- **权限控制**: 基于角色的访问控制
- **API限流**: 防止恶意请求
- **CORS配置**: 跨域请求控制

### 隐私保护
- **数据最小化**: 只收集必要数据
- **用户同意**: 明确的用户同意机制
- **数据删除**: 支持用户数据删除
- **合规性**: 符合GDPR等隐私法规

## 扩展性设计

### 水平扩展
- **无状态设计**: API服务无状态，易于扩展
- **负载均衡**: 自动负载均衡
- **数据库分片**: 支持数据库水平分片

### 功能扩展
- **插件架构**: 支持功能模块化扩展
- **API版本控制**: 支持API版本管理
- **微服务**: 支持服务拆分和独立部署

### 国际化扩展
- **多语言支持**: 易于添加新语言
- **本地化**: 支持不同地区的本地化需求
- **时区处理**: 支持多时区用户

---

*技术文档版本: v1.0*  
*最后更新时间: 2024年12月* 