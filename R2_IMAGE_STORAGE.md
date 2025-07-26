# Cloudflare R2 图片存储系统

## 📁 存储架构

### R2 存储桶配置
- **存储桶名称**: `recipe-images`
- **绑定名称**: `RECIPE_IMAGES`
- **访问方式**: 通过 Cloudflare Workers 提供图片服务

### 图片服务 URL 格式
```
https://recipe-easy.annnb016.workers.dev/images/{filename}
```

## 🖼️ 已上传的图片

所有食谱图片已成功上传到 R2 存储桶：

1. `butter-chicken.png`
2. `chicken-teriyaki.png`
3. `greek-salad.png`
4. `mapo-tofu.png`
5. `pad-thai.png`
6. `ratatouille.png`
7. `spaghetti-carbonara.png`
8. `tacos-al-pastor.png`

## 🔧 技术实现

### Cloudflare Workers 图片服务
- **路由**: `/images/{filename}`
- **功能**: 从 R2 存储桶获取图片并提供服务
- **缓存**: 设置了 1 年的缓存时间
- **CORS**: 支持跨域访问

### 数据库集成
- 所有食谱的 `image_url` 字段已更新为 Workers 图片服务 URL
- 支持动态图片加载

## 📊 当前状态

### ✅ 已完成
- [x] 创建 R2 存储桶
- [x] 上传所有食谱图片到远程存储桶
- [x] 配置 Cloudflare Workers 图片服务
- [x] 更新数据库中的图片 URL
- [x] 前端支持从 R2 动态加载图片

### 🔄 图片访问流程
```
前端请求图片
    ↓
Cloudflare Workers (/images/{filename})
    ↓
R2 存储桶 (recipe-images)
    ↓
返回图片数据 + 缓存头
```

## 🚀 优势

1. **全球 CDN**: Cloudflare 的全球边缘网络
2. **高性能**: R2 存储 + Workers 计算
3. **成本效益**: R2 存储成本低廉
4. **可扩展性**: 支持大量图片存储
5. **缓存优化**: 1 年缓存时间减少重复请求

## 📝 管理命令

### 上传新图片
```bash
npx wrangler r2 object put recipe-images/{filename} --file={local-path} --remote
```

### 下载图片
```bash
npx wrangler r2 object get recipe-images/{filename} --file={local-path} --remote
```

### 删除图片
```bash
npx wrangler r2 object delete recipe-images/{filename} --remote
```

## 🔗 相关配置

### wrangler.toml
```toml
[[r2_buckets]]
binding = "RECIPE_IMAGES"
bucket_name = "recipe-images"
```

### Workers 环境变量
- `RECIPE_IMAGES`: R2 存储桶绑定

现在所有食谱图片都通过 Cloudflare R2 + Workers 提供服务，实现了高性能的图片存储和分发系统！
