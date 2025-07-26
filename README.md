# Recipe Easy 应用

## Cloudflare D1数据库集成

本项目集成了Cloudflare D1数据库，一个可扩展的SQL数据库，完全集成在Cloudflare Workers平台上。

### 设置步骤

1. 安装Wrangler CLI (已在项目依赖中)
```bash
npm install wrangler --save-dev
```

2. 登录到你的Cloudflare账户
```bash
npx wrangler login
```

3. 创建D1数据库
```bash
npx wrangler d1 create recipe-database
```

4. 编辑`wrangler.toml`文件，使用从上一步骤获得的数据库ID

5. 创建本地开发数据库和表
```bash
npx wrangler d1 execute recipe-database --local --file=./lib/database/schema.sql
```

6. 开发模式运行Worker
```bash
npx wrangler dev --local
```

7. 部署Worker到Cloudflare
```bash
npx wrangler deploy
```

### API端点

数据库API提供以下端点：

#### 食谱API
- `GET /api/recipes` - 获取所有食谱
  - 查询参数:
    - `limit`: 返回的最大结果数量(默认: 10)
    - `offset`: 结果偏移量(默认: 0)
    - `cuisine_id`: 按菜系筛选食谱
- `GET /api/recipes/:id` - 获取单个食谱
- `POST /api/recipes` - 创建新食谱
  - 必要参数: name, description, ingredients, instructions
  - 可选参数: imageUrl, cookingTime, servings, difficulty, cuisineId, userId
- `PUT /api/recipes/:id` - 更新食谱
- `DELETE /api/recipes/:id` - 删除食谱

#### 用户API
- `GET /api/users/:id` - 获取用户信息
- `POST /api/users` - 创建新用户
  - 必要参数: id, email
  - 可选参数: name, avatarUrl, role (默认: 'user')
- `PUT /api/users/:id` - 更新用户信息

#### 菜系API
- `GET /api/cuisines` - 获取所有菜系
- `GET /api/cuisines/:id` - 获取单个菜系
- `POST /api/cuisines` - 创建新菜系 (仅管理员)
  - 必要参数: name
  - 可选参数: description, iconUrl
  - 权限: 需要管理员权限
- `PUT /api/cuisines/:id` - 更新菜系 (仅管理员)
- `DELETE /api/cuisines/:id` - 删除菜系 (仅管理员)

#### 用户偏好API
- `GET /api/preferences/:userId` - 获取用户偏好
- `PUT /api/preferences/:userId` - 更新用户偏好
  - 可选参数: dietaryRestrictions, allergies, favoriteRecipes

### 数据模型

#### 用户(users)
```
{
  "id": "string",         // 用户唯一ID
  "email": "string",      // 电子邮箱(唯一)
  "name": "string",       // 可选，用户名称
  "avatarUrl": "string",  // 可选，头像URL
  "role": "string",       // 用户角色: "admin"或"user"
  "createdAt": "string",  // 创建时间(ISO格式)
  "updatedAt": "string"   // 更新时间(ISO格式)
}
```

#### 食谱(recipes)
```
{
  "id": number,           // 食谱唯一ID
  "name": "string",       // 食谱名称
  "description": "string", // 食谱描述
  "ingredients": string[], // 原料列表
  "instructions": string[], // 制作步骤
  "imageUrl": "string",   // 可选，图片URL
  "cookingTime": number,  // 可选，烹饪时间(分钟)
  "servings": number,     // 可选，份量
  "difficulty": "string", // 可选，难度
  "cuisineId": number,    // 可选，菜系ID
  "cuisine": {...},       // 可选，关联的菜系对象
  "userId": "string",     // 可选，创建者ID
  "expirationDate": "string", // 可选，过期时间(非管理员创建的食谱7天后过期)
  "createdAt": "string",  // 创建时间(ISO格式)
  "updatedAt": "string"   // 更新时间(ISO格式)
}
```

#### 菜系(cuisines)
```
{
  "id": number,           // 菜系唯一ID
  "name": "string",       // 菜系名称(唯一)
  "description": "string", // 可选，菜系描述
  "iconUrl": "string",    // 可选，图标URL
  "createdAt": "string",  // 创建时间(ISO格式)
  "updatedAt": "string"   // 更新时间(ISO格式)
}
```

### 环境变量

创建一个`.env.local`文件，添加以下环境变量：
```
NEXT_PUBLIC_CLOUDFLARE_API_URL=http://localhost:8787
```

在生产环境中，更新此URL为你的Cloudflare Worker的URL。

# Recipe Gen AI 🧑‍🍳

![Demo Preview](./public/demo-img.jpg)

An intelligent recipe generation platform that helps you discover delicious recipes based on your available ingredients. Built with modern web technologies and AI capabilities.

## ✨ Core Features

- 🔍 **Smart Ingredient Selection**
  - Alphabetical and categorized views
  - Dynamic search and filtering
  - Real-time ingredient suggestions

- 🎨 **Modern UI/UX**
  - Clean and intuitive interface
  - Responsive design for all devices
  - Dark/Light mode support
  - Beautiful animations and transitions

- 🤖 **AI-Powered**
  - Intelligent recipe generation
  - Considers ingredient combinations
  - Customizable recipe preferences

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 14](https://nextjs.org/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Animations**: Custom CSS animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/nasirann/recipegenai.git
```

2. Navigate to the project directory
```bash
cd recipegenai
```

3. Install dependencies
```bash
npm install
# or
yarn install
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage Guide

1. **Select Ingredients**
   - Choose from alphabetical or categorized view
   - Click on ingredients to add them to your selection
   - Remove ingredients by clicking the 'X' button

2. **Generate Recipe**
   - Click "Generate Recipe" once you've selected your ingredients
   - Wait for the AI to create your personalized recipe
   - View detailed instructions and cooking tips

## 📂 Project Structure

```
recipegenai/
├── app/                # Next.js app directory
│   ├── api/           # API routes
│   └── page.tsx       # Main page
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   ├── icons/        # Icon components
│   └── layout/       # Layout components
├── lib/              # Utilities and constants
│   └── constants/    # Constant definitions
└── public/           # Static assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork this project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Lucide Icons](https://lucide.dev/) for the icon set
- All our contributors and supporters

---

Made with ❤️