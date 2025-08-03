# 🍳 RecipeEasy - AI Recipe Generator

> AI-powered intelligent recipe generation platform that makes cooking simple and fun. Input ingredients, and AI creates delicious recipes for you!

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)

🌐 **Live Demo**: [https://recipe-easy.com](https://recipe-easy.com)

## 🎯 Product Highlights

- **🆓 Completely Free Recipe Generation** - No credits required, start using immediately
- **🧠 Smart Model Selection** - Automatically selects the best AI model based on language
- **🌍 Multi-language Optimization** - Chinese users automatically use Qwen Plus, English users automatically use GPT-4o Mini
- **🎨 Beautiful Image Generation** - Smart image model selection, only 1 credit per image
- **📱 Perfect Mobile Experience** - Responsive design, supports all devices

## ✨ Core Features

### 🎯 Intelligent Recipe Generation
- **🤖 Smart Model Selection**: Automatically selects the best AI model based on language (Chinese users use Qwen Plus, English users use GPT-4o Mini)
- **📝 Personalized Recipes**: Intelligently generates recipes based on your selected ingredients
- **🌍 Multi-language Support**: Chinese and English bilingual interface with automatic model optimization
- **🎨 AI Image Generation**: Smart image model selection (Chinese users use Wanx, English users use Flux Schnell)
- **⚡ Fast Generation**: Complete recipe generation in 20-120 seconds
- **🆓 Free Recipes**: Recipe generation is completely free, no credits required

### 🛠️ User-Friendly Features
- **🔍 Smart Ingredient Selection**: Preset categories + custom input with Chinese and English search support
- **📱 Responsive Design**: Perfectly adapted for desktop and mobile devices
- **🌙 Theme Switching**: Free switching between light and dark themes
- **🔐 Easy Login**: Google OAuth + email login
- **💎 Credit System**: New users receive 100 free credits (only for image generation)
- **🎛️ Admin Privileges**: Administrators can manually select AI models with unlimited credits

### 🍽️ Recipe Features
- **📊 Detailed Steps**: Clear cooking steps and techniques
- **⏱️ Time Control**: Supports quick, medium, and long cooking times
- **🎯 Difficulty Levels**: Simple, medium, and hard difficulty levels
- **🌏 Global Cuisines**: Supports various cuisine styles
- **👨‍🍳 Chef Tips**: Each recipe includes professional cooking tips

### 🧠 Smart Optimization Features
- **🌐 Language Adaptation**: Automatically selects the best AI model based on user language
- **🎯 Model Optimization**: Chinese users automatically use Qwen Plus, English users automatically use GPT-4o Mini
- **🖼️ Smart Images**: Automatically selects the most suitable image generation model based on language
- **⚡ Performance Optimization**: Ensures optimal generation results for each language

## 🚀 Quick Start

### Try Without Registration
1. Visit [https://recipe-easy.com](https://recipe-easy.com)
2. Select or input your available ingredients
3. Set cooking preferences (time, difficulty, cuisine)
4. Click generate and wait for AI to create delicious recipes

### Register Account for More Features
- 🎨 **AI Image Generation**: Generate beautiful images for recipes (1 credit per image)
- 📊 **Usage Statistics**: View your credits and usage information
- 🔐 **Personal Account**: Manage your personal information and settings
- 🎯 **Smart Optimization**: Automatically selects the best AI model based on language

## 🏗️ Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │   Supabase      │    │  Cloudflare     │
│   (Frontend)    │◄──►│   (Auth+DB)     │    │  (Worker+D1+R2) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   User Mgmt     │    │   File Storage  │
│ • Smart Model   │    │ • Credit System │    │ • Image Storage │
│   Selection     │    │ • Usage Stats   │    │ • Data Backup   │
│ • Qwen Plus     │    │ • Access Control│    │ • CDN Delivery  │
│ • GPT-4o Mini   │    │ • User Profiles │    │ • Global Dist.  │
│ • Wanx (Images) │    │ • Credit Mgmt   │    │ • High Avail.   │
│ • Flux Schnell  │    │ • Admin Tools   │    │ • Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
recipe-easy/
├── app/                          # Next.js 14 App Router
│   ├── [locale]/                 # Internationalization routes (en/zh)
│   │   ├── layout.tsx           # Layout components
│   │   ├── page.tsx             # Homepage
│   │   ├── privacy/             # Privacy Policy
│   │   └── terms/               # Terms of Service
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication
│   │   ├── generate-recipe/     # Recipe generation
│   │   ├── generate-image/      # Image generation
│   │   ├── ingredients/         # Ingredient management
│   │   ├── recipes/             # Recipe management
│   │   └── user-usage/          # User usage statistics
│   ├── layout.tsx               # Root layout
│   ├── robots.ts                # SEO robots.txt
│   └── sitemap.ts               # SEO sitemap
├── components/                   # React components
│   ├── auth/                    # Authentication components
│   ├── layout/                  # Layout components
│   │   └── sections/            # Page sections
│   │       ├── hero.tsx         # Hero section
│   │       ├── tutorial.tsx     # Tutorial section
│   │       ├── recipes.tsx      # Recipe showcase
│   │       ├── features.tsx     # Feature highlights
│   │       ├── faq.tsx          # FAQ section
│   │       ├── testimonial.tsx  # User testimonials
│   │       └── footer.tsx       # Footer
│   └── ui/                      # UI base components
├── contexts/                    # React Context
├── hooks/                       # Custom Hooks
├── lib/                         # Utilities
│   ├── services/                # Service layer
│   ├── utils/                   # Utility functions
│   ├── config.ts                # Configuration management
│   ├── prompts.ts               # AI prompts
│   └── types/                   # Type definitions
├── messages/                    # Internationalization files
│   ├── en.json                  # English translations
│   └── zh.json                  # Chinese translations
├── public/                      # Static assets
└── src/                         # Cloudflare Worker
    └── worker.ts                # Backend API logic
```

## 🛠️ Development Guide

### Requirements
- Node.js 18+
- npm or yarn
- Git

### Local Development
```bash
# Clone the project
git clone https://github.com/nasirannn/recipe-easy.git
cd recipe-easy

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local file and add necessary API keys

# Start development server
npm run dev

# Visit http://localhost:3000
```

### Environment Variables Configuration
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Worker URL
WORKER_URL=https://your-worker.your-subdomain.workers.dev

# AI Service API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
QWENPLUS_API_KEY=your_qwenplus_api_key
DASHSCOPE_API_KEY=your_dashscope_api_key
REPLICATE_API_TOKEN=your_replicate_api_token

# Optional Configuration
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=your_clarity_id
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Deployment
```bash
# Deploy Cloudflare Worker
npm run deploy

# Deploy Cloudflare Pages
npm run deploy:cf
```

## 📊 Performance Optimization

### Frontend Optimization
- ✅ **Image Lazy Loading**: Improves page loading speed
- ✅ **Code Splitting**: On-demand component loading
- ✅ **Server-Side Rendering**: Better SEO and first-screen loading
- ✅ **Static Generation**: Pre-rendered static pages
- ✅ **Cache Strategy**: Intelligent cache management

### Backend Optimization
- ✅ **API Caching**: Reduces redundant calculations
- ✅ **Database Optimization**: Efficient queries and indexing
- ✅ **CDN Acceleration**: Global content delivery
- ✅ **Image Optimization**: Automatic compression and format conversion

## 🔒 Security Measures

- ✅ **Input Validation**: Prevents malicious input
- ✅ **SQL Injection Protection**: Parameterized queries
- ✅ **XSS Protection**: Content Security Policy
- ✅ **CSRF Protection**: Cross-Site Request Forgery protection
- ✅ **API Key Protection**: Environment variable management
- ✅ **User Authentication**: Secure login system

## 📈 Monitoring and Analytics

### User Analytics
- **Google Analytics 4**: User behavior analysis
- **Microsoft Clarity**: User session recording
- **Cloudflare Analytics**: Performance monitoring

### Performance Metrics
- Page loading time optimization
- API response time optimization
- Image loading optimization
- Mobile experience optimization

## 🤝 Contributing

We welcome all forms of contributions!

### How to Contribute
1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Development Standards
- Use TypeScript for type checking
- Follow ESLint rules
- Use Prettier for code formatting
- Write clear commit messages
- Add necessary tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend services
- [Cloudflare](https://cloudflare.com/) - Cloud services
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI component library
- [DeepSeek](https://deepseek.com/) - AI language model service
- [Alibaba Cloud](https://www.aliyun.com/) - Qwen AI service
- [OpenAI](https://openai.com/) - GPT-4o Mini model service
- [Replicate](https://replicate.com/) - AI model deployment platform

## 📞 Contact Us

- 🌐 Website: [https://recipe-easy.com](https://recipe-easy.com)
- 📧 Email: [annnb016@gmail.com](mailto:annnb016@gmail.com)
- 🐛 Issue Report: [GitHub Issues](https://github.com/nasirannn/recipe-easy/issues)

---

⭐ If this project helps you, please give us a star!

**Let AI add infinite possibilities to your cooking journey!** 🍳✨ 