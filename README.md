# 🍳 RecipeEasy

> AI-Powered Recipe Generation Platform - Transform ingredients into delicious recipes with intelligent AI assistance

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**🌐 Live Demo**: [https://recipe-easy.com](https://recipe-easy.com)

## ✨ Features

- **🤖 AI-Powered Generation**: Smart model selection for Chinese (Qwen Plus) and English (GPT-4o Mini)
- **🎨 AI Image Generation**: High-quality recipe visuals with Wanx (Chinese) and Flux Schnell (English)
- **🌍 Multi-Language Support**: Native Chinese and English with localized AI models
- **🔐 User Management**: Google OAuth, email login, credit system, and personalization
- **🌙 Modern UX**: Light/dark themes, responsive design, and edge computing performance
- **⚡ Edge Architecture**: Built on Cloudflare Workers for global performance

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0+
- npm 9.0.0+
- Git
- Cloudflare account

### Installation

```bash
# Clone and setup
git clone https://github.com/nasirannn/recipe-easy.git
cd recipe-easy
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development
npm run dev
```

**Access**: Frontend at [http://localhost:3000](http://localhost:3000), Backend at [http://localhost:8787](http://localhost:8787)

## 🏗️ Architecture

RecipeEasy uses a modern, scalable architecture:

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS 4 (deployed via OpenNext)
- **Backend**: Cloudflare Workers with D1 database
- **AI Integration**: Multi-model routing for optimal language support
- **Deployment**: OpenNext (Next.js → Cloudflare Workers) + Cloudflare Workers (backend)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Cloudflare Workers, D1 Database, Cloudflare R2
- **AI Models**: OpenAI GPT-4o Mini, Alibaba Qwen Plus
- **Image AI**: Wanx, Flux Schnell
- **Authentication**: Google OAuth, Supabase Auth
- **Styling**: Tailwind CSS, Radix UI, Lucide Icons

## 📁 Project Structure

```
recipe-easy/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and configurations
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── worker/                  # Cloudflare Worker backend
├── public/                  # Static assets
└── docs/                    # Documentation
```

## ⚙️ Configuration

### Environment Variables

```bash
# AI Services
OPENAI_API_KEY=your_openai_key
QWEN_API_KEY=your_qwen_key
WANX_API_KEY=your_wanx_key
FLUX_API_KEY=your_flux_key

# Database & Storage
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_DATABASE_ID=your_db_id
CLOUDFLARE_R2_BUCKET_NAME=your_bucket

# Authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Analytics
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=your_clarity_id
```

## 🚀 Deployment

### Frontend (OpenNext + Cloudflare Workers)
```bash
npm run deploy          # Deploy to Cloudflare Workers via OpenNext
npm run preview         # Preview OpenNext build locally
npm run upload          # Upload OpenNext build
```

### Backend (Cloudflare Workers)
```bash
npm run deploy:worker           # Deploy worker
npm run deploy:worker:staging   # Deploy to staging
npm run deploy:worker:production # Deploy to production
```

### Database Operations
```bash
npm run db:query "SELECT * FROM users LIMIT 10"  # Execute queries
npm run db:backup                                # Create backup
npm run db:migrate                               # Apply migrations
npm run db:reset                                 # Reset dev database
```

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:cf          # Start Cloudflare Worker locally
npm run dev:all         # Start both frontend and backend

# Building
npm run build           # Build Next.js app
npm run build:cf        # Build for Cloudflare Pages
npm run build:worker    # Build Cloudflare Worker

# Quality Assurance
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript checks

# Production
npm run start           # Start production server
npm run analyze         # Analyze bundle size
```

### Local Development

1. **Frontend**: `npm run dev` → [http://localhost:3000](http://localhost:3000)
2. **Backend**: `npm run dev:cf` → [http://localhost:8787](http://localhost:8787)
3. **Database**: `npm run db:query "SELECT COUNT(*) FROM recipes"`

## 🔒 Security

- **Authentication**: Secure OAuth and email-based login
- **API Security**: Rate limiting and request validation
- **Data Protection**: Encrypted storage and secure API endpoints
- **Environment Variables**: Secure configuration management

## 🌍 Internationalization

- **Multi-Language AI**: Automatic model selection based on user language
- **Localized Content**: Chinese and English support with cultural context
- **Smart Routing**: AI models optimized for specific languages

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with clean, documented code
4. **Commit** using conventional format: `git commit -m 'feat: add amazing feature'`
5. **Push** and create a pull request

### Development Standards
- Use TypeScript for all new code
- Follow ESLint and Prettier configuration
- Write tests for new features
- Update documentation
- Use conventional commit format

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**License Summary**: ✅ Commercial Use, ✅ Modification, ✅ Distribution, ✅ Private Use, ❌ Limited Liability, ❌ No Warranty

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - React framework
- **[Cloudflare](https://cloudflare.com/)** - Edge computing infrastructure
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - UI components
- **[Alibaba Cloud](https://www.aliyun.com/)** - Qwen AI models
- **[OpenAI](https://openai.com/)** - GPT models

## 📞 Support & Community

- **Website**: [https://recipe-easy.com](https://recipe-easy.com)
- **Documentation**: [https://docs.recipe-easy.com](https://docs.recipe-easy.com)
- **Email**: [contact@recipe-easy.com](mailto:contact@recipe-easy.com)
- **Issues**: [GitHub Issues](https://github.com/nasirannn/recipe-easy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nasirannn/recipe-easy/discussions)

### Project Status
- **Version**: 1.0.0
- **Status**: Active Development
- **Last Updated**: August 2025

---

## ⭐ Star This Repository

If RecipeEasy helps you create amazing recipes, please consider giving us a star! ⭐

**Let AI transform your cooking experience!** 🍳✨

---

*Built with ❤️ by the RecipeEasy team* 