# Recipe Easy: AI-Powered Recipe Platform

Recipe Easy is an intelligent recipe generation and management platform. It leverages AI to create personalized recipes based on your selected ingredients and integrates seamlessly with Cloudflare D1 for scalable cloud database support.

## 🚀 Features

- **AI Recipe Generation**: Instantly generate delicious recipes with AI based on your chosen ingredients
- **Modern UI/UX**: Responsive, clean interface with dark/light mode and smooth animations
- **Cloudflare D1 Integration**: Fast, scalable SQL database for both local and cloud development
- **Comprehensive API**: Manage recipes, users, cuisines, and user preferences
- **Mobile Friendly**: Consistent experience across desktop and mobile

## 🛠 Tech Stack

- **Frontend**: Next.js 14
- **Type Safety**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide Icons
- **Database**: Cloudflare D1

## ⚡️ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nasirann/recipegenai.git
   cd recipegenai
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
yarn install
   ```
3. Configure environment variables:
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_CLOUDFLARE_API_URL=http://localhost:8787
   ```
   (Replace with your Cloudflare Worker URL in production)
4. Initialize Cloudflare D1 database:
   ```bash
   npx wrangler d1 create recipe-database
   npx wrangler d1 execute recipe-database --local --file=./lib/database/schema.sql
   ```
5. Start the development server:
   ```bash
   npm run dev
   # or
yarn dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

## 📚 API Overview

- `GET /api/recipes` — List recipes
- `POST /api/recipes` — Create a recipe
- `GET /api/users/:id` — Get user info
- `POST /api/cuisines` — Create a cuisine (admin only)
- ...and more (see source for full API)

## 🗂 Project Structure

```
recipegenai/
├── app/           # Next.js app directory
├── components/    # React components
├── lib/           # Utilities and constants
├── public/        # Static assets
├── messages/      # i18n support
├── schema.sql     # Database schema
└── ...
```

## 🤝 Contributing

Contributions are welcome!
1. Fork this repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit and push your changes
4. Open a Pull Request

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

Made with ❤️ by the Recipe Easy team and open source contributors.