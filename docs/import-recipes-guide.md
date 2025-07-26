# 食谱数据导入指南

本指南介绍如何将 `components/layout/sections/recipes.tsx` 文件中的示例食谱数据导入到 Cloudflare D1 数据库中。

## 📋 概述

项目中包含了8个精选的国际食谱，涵盖了不同的菜系和难度等级：

1. **麻婆豆腐 (Mapo Tofu)** - 中式菜，中等难度
2. **意大利面卡邦纳拉 (Spaghetti Carbonara)** - 意式菜，简单
3. **法式蔬菜杂烩 (Ratatouille)** - 法式菜，中等难度
4. **印度黄油鸡 (Butter Chicken)** - 印度菜，中等难度
5. **日式照烧鸡 (Chicken Teriyaki)** - 日式菜，简单
6. **希腊沙拉 (Greek Salad)** - 希腊菜，简单
7. **泰式炒河粉 (Pad Thai)** - 泰式菜，中等难度
8. **墨西哥牧师肉塔可 (Tacos al Pastor)** - 墨西哥菜，中等难度

## 🚀 导入方法

### 方法一：使用 Web 界面（推荐）

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 在浏览器中访问：
   ```
   http://localhost:3000/import-recipes.html
   ```

3. 点击"开始导入数据"按钮

4. 等待导入完成，查看结果统计

### 方法二：使用 API 端点

直接调用 API 端点进行导入：

```bash
curl -X POST http://localhost:3000/api/import-recipes \
  -H "Content-Type: application/json"
```

### 方法三：使用脚本（开发环境）

运行 TypeScript 脚本：

```bash
npx tsx scripts/import-recipes.ts
```

## 📊 数据结构

### 食谱数据包含以下字段：

- **基本信息**：标题、描述、图片URL
- **分类标签**：菜系、特色标签（如"辣"、"素食"等）
- **烹饪信息**：烹饪时间、份量、难度等级
- **详细内容**：食材清单、制作步骤、厨师小贴士

### 数据库映射：

| 原始字段 | 数据库字段 | 说明 |
|---------|-----------|------|
| `title` | `name` | 食谱名称 |
| `description` | `description` | 食谱描述 |
| `ingredients` | `ingredients` | 食材清单（JSON数组） |
| `steps` | `instructions` | 制作步骤（JSON数组） |
| `chefTips` | - | 存储在说明中或单独处理 |
| `tags` | `cuisineId` | 根据标签映射到菜系ID |
| `cookTime` | `cookingTime` | 烹饪时间（分钟） |
| `servings` | `servings` | 份量 |
| `difficulty` | `difficulty` | 难度等级 |
| `image_url` | `imageUrl` | 图片URL |

## 🗄️ 数据库表结构

导入过程会自动创建以下数据：

### 菜系表 (cuisines)
- 中式菜
- 意式菜  
- 法式菜
- 印度菜
- 日式菜
- 希腊菜
- 泰式菜
- 墨西哥菜

### 食谱表 (recipes)
- 8个完整的食谱记录
- 包含所有必要的字段和关联关系

## ⚠️ 注意事项

1. **数据库初始化**：首次运行时会自动创建数据库表结构
2. **重复导入**：多次导入可能会创建重复记录，建议在导入前清空相关表
3. **图片资源**：确保 `/public/recipe-images/` 目录下有对应的图片文件
4. **环境配置**：确保 Cloudflare D1 数据库配置正确

## 🔧 故障排除

### 常见问题：

1. **数据库连接失败**
   - 检查 `wrangler.toml` 中的数据库配置
   - 确认 D1 数据库已创建并绑定

2. **导入部分失败**
   - 查看控制台错误日志
   - 检查数据格式是否正确

3. **菜系创建失败**
   - 确认菜系名称没有重复
   - 检查数据库写入权限

### 调试命令：

```bash
# 查看数据库状态
wrangler d1 execute recipe-easy --command "SELECT COUNT(*) FROM recipes;"

# 查看菜系数据
wrangler d1 execute recipe-easy --command "SELECT * FROM cuisines;"

# 清空数据（谨慎使用）
wrangler d1 execute recipe-easy --command "DELETE FROM recipes;"
wrangler d1 execute recipe-easy --command "DELETE FROM cuisines;"
```

## 📝 后续步骤

导入完成后，您可以：

1. 通过 `/api/recipes` 端点查看导入的食谱
2. 通过 `/api/cuisines` 端点查看创建的菜系
3. 在前端界面中浏览和搜索食谱
4. 根据需要添加更多食谱数据

## 🤝 贡献

如果您想添加更多食谱数据：

1. 在 `lib/data/sample-recipes.ts` 中添加新的食谱对象
2. 确保数据格式与现有结构一致
3. 重新运行导入脚本

---

**提示**：建议在生产环境部署前，先在开发环境中测试导入功能，确保所有数据都能正确导入和显示。
