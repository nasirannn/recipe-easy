# 🍳 RecipeEasy

> AI-powered recipe generation platform that transforms your ingredients into delicious recipes

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)

**Live Demo**: [https://recipe-easy.com](https://recipe-easy.com)

## ✨ Features

- 🤖 **Smart AI Models**: Automatically selects optimal AI models based on language
- 🌍 **Multi-language**: Chinese (Qwen Plus) and English (GPT-4o Mini) support
- 🎨 **Image Generation**: AI-powered recipe images with smart model selection
- 📱 **Responsive Design**: Perfect experience on all devices
- 🔐 **User Authentication**: Google OAuth and email login
- 💎 **Credit System**: Free credits for new users
- 🌙 **Theme Support**: Light and dark mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/nasirannn/recipe-easy.git
cd recipe-easy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Architecture

```
Frontend (Next.js 14)     Backend (Cloudflare Workers)     Database (D1 + R2)
     │                            │                            │
     ├── React Components         ├── API Routes               ├── User Data
     ├── Tailwind CSS            ├── AI Integration           ├── Recipe Storage
     ├── TypeScript              ├── File Storage             └── Image Storage
     └── Responsive UI           └── Authentication
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form handling
- **Zustand** - State management

### Backend
- **Cloudflare Workers** - Serverless functions
- **D1 Database** - SQLite database
- **R2 Storage** - Object storage for images
- **Wrangler** - Development and deployment tool

### AI Services
- **Qwen Plus** - Chinese language model
- **GPT-4o Mini** - English language model
- **Wanx** - Chinese image generation
- **Flux Schnell** - English image generation

## 📁 Project Structure

```
recipe-easy/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalization (en/zh)
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── auth/              # Auth components
│   ├── layout/            # Layout components
│   └── ui/                # UI components
├── contexts/               # React contexts
├── hooks/                  # Custom hooks
├── lib/                    # Utilities and services
├── messages/               # i18n translations
├── public/                 # Static assets
├── src/                    # Cloudflare Worker
│   └── worker.ts          # Backend logic
└── wrangler.toml          # Cloudflare configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare Worker
WORKER_URL=your_worker_url

# AI Services
QWENPLUS_API_KEY=your_qwenplus_key
DASHSCOPE_API_KEY=your_dashscope_key
REPLICATE_API_TOKEN=your_replicate_token

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_CLARITY_ID=your_clarity_id
```

## 🚀 Deployment

### Frontend (Cloudflare Pages)

```bash
# Build and deploy
npm run deploy

# Alternative deployment
npm run deploy:cf
```

### Backend (Cloudflare Workers)

```bash
# Deploy worker
npm run deploy:worker
```

### Database Operations

```bash
# Execute database queries
npm run db:query "SELECT * FROM users"

# Backup database
npm run db:backup

# Apply migrations
npm run db:migrate
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start Next.js dev server
npm run dev:cf       # Start Cloudflare Worker locally
npm run build        # Build Next.js app
npm run build:cf     # Build for Cloudflare Pages
npm run lint         # Run ESLint
npm run start        # Start production server
```

### Local Development

1. **Frontend**: `npm run dev` (runs on port 3000)
2. **Backend**: `npm run dev:cf` (runs on port 8787)
3. **Database**: Use `npm run db:query` for database operations

## 📊 Performance

- **Image Optimization**: Automatic compression and format conversion
- **Code Splitting**: On-demand component loading
- **Static Generation**: Pre-rendered pages for better SEO
- **CDN Delivery**: Global content distribution via Cloudflare
- **API Caching**: Intelligent response caching

## 🔒 Security

- Input validation and sanitization
- SQL injection protection
- XSS prevention
- CSRF protection
- Secure API key management
- User authentication and authorization

## 🌍 Internationalization

The app supports multiple languages with automatic model selection:

- **Chinese**: Uses Qwen Plus for optimal results
- **English**: Uses GPT-4o Mini for best performance
- **Images**: Automatically selects appropriate image generation models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards

- Use TypeScript for all new code
- Follow ESLint rules
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Cloudflare](https://cloudflare.com/) - Cloud infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Alibaba Cloud](https://www.aliyun.com/) - Qwen AI models
- [OpenAI](https://openai.com/) - GPT models

## 📞 Support

- **Website**: [https://recipe-easy.com](https://recipe-easy.com)
- **Email**: [annnb016@gmail.com](mailto:annnb016@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/nasirannn/recipe-easy/issues)

---

⭐ **Star this repository if it helps you!**

**Let AI transform your cooking experience!** 🍳✨ 