# 我的菜谱页面修复

## 问题描述

"我的菜谱"页面没有数据显示，原因是API调用链存在问题：

1. **API调用失败**: `/api/recipes/user/[userId]` 路由调用Worker API失败
2. **环境变量配置错误**: `WORKER_URL` 指向错误的地址
3. **Worker API不存在**: 远程Worker API无法访问

## 修复内容

### 1. 修改文件
- `app/api/recipes/user/[userId]/route.ts`

### 2. 具体修改

#### 修复前的问题：
```typescript
// 直接调用Worker API，但Worker API不存在或无法访问
const response = await fetch(
  `${process.env.WORKER_URL || 'https://api.recipe-easy.com'}/api/recipes/user/${userId}?page=${page}&limit=${limit}&lang=${lang}`,
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);
```

#### 修复后的解决方案：
```typescript
// 检查运行环境，在Cloudflare Workers环境中直接查询数据库
const isWorker = isCloudflareWorkers();
if (isWorker) {
  // 直接查询数据库
  return await getUserRecipesFromDatabase(userId, page, limit, lang);
} else {
  // 本地开发环境调用Worker API
  return await getUserRecipesFromWorker(userId, page, limit, lang);
}
```

### 3. 新增功能

#### 数据库直接查询函数：
- `getUserRecipesFromDatabase()`: 在Cloudflare Workers环境中直接查询D1数据库
- 支持国际化查询（`recipes_i18n` 表）
- 支持分页和排序
- 返回标准化的数据格式

#### Worker API调用函数：
- `getUserRecipesFromWorker()`: 在本地开发环境中调用Worker API
- 保持向后兼容性
- 错误处理和日志记录

### 4. 数据查询逻辑

```sql
-- 用户菜谱查询SQL
SELECT 
  r.id, r.title, r.description, r.cooking_time as cookingTime,
  r.servings, r.difficulty, r.tags, r.ingredients, r.seasoning,
  r.instructions, r.chef_tips as chefTips, r.created_at as createdAt,
  r.updated_at as updatedAt, c.id as cuisine_id, c.name as cuisine_name,
  ri.image_path as imagePath,
  -- 国际化字段
  COALESCE(ri18n.title, r.title) as localized_title,
  COALESCE(ri18n.description, r.description) as localized_description,
  -- ... 其他国际化字段
FROM recipes r
LEFT JOIN cuisines c ON r.cuisine_id = c.id
LEFT JOIN recipe_images ri ON r.id = ri.recipe_id
LEFT JOIN recipes_i18n ri18n ON r.id = ri18n.recipe_id AND ri18n.language_code = ?
WHERE r.user_id = ?
ORDER BY r.created_at DESC
LIMIT ? OFFSET ?
```

### 5. 返回数据格式

```json
{
  "success": true,
  "results": [
    {
      "id": "recipe-id",
      "title": "菜谱标题",
      "description": "菜谱描述",
      "imagePath": "图片路径",
      "cookingTime": 30,
      "servings": 4,
      "difficulty": "Easy",
      "tags": ["标签1", "标签2"],
      "ingredients": ["食材1", "食材2"],
      "seasoning": ["调料1", "调料2"],
      "instructions": ["步骤1", "步骤2"],
      "chefTips": ["技巧1", "技巧2"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "cuisine": {
        "id": 1,
        "name": "中式"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 12,
  "hasMore": true
}
```

## 验证步骤

### 1. 测试API调用
```bash
# 测试用户菜谱API
curl "https://recipe-easy.com/api/recipes/user/YOUR_USER_ID?page=1&limit=12&lang=en"
```

### 2. 检查数据库查询
- 确认用户ID存在
- 确认用户有创建的菜谱
- 检查菜谱数据完整性

### 3. 前端页面测试
- 登录用户账号
- 访问 `/my-recipes` 页面
- 确认菜谱列表正常显示

## 技术说明

### 环境检测
- 使用 `isCloudflareWorkers()` 函数检测运行环境
- 在Cloudflare Workers环境中直接使用D1数据库
- 在本地开发环境中调用Worker API

### 错误处理
- 详细的错误日志记录
- 标准化的错误响应格式
- 数据库连接检查

### 性能优化
- 支持分页查询
- 按创建时间倒序排列
- 国际化数据优先使用本地化版本

## 影响范围

- ✅ 修复"我的菜谱"页面数据加载问题
- ✅ 支持用户查看自己创建的菜谱
- ✅ 支持分页和国际化
- ✅ 保持与其他API的一致性
- ✅ 不影响其他功能模块 