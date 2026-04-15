import type { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generateSeoMetadata({
    title: 'Authentication Callback - RecipeEasy',
    description: 'Secure RecipeEasy authentication callback that completes sign-in, verifies magic links, and returns you to your saved recipes, meal plans, or workspace.',
    path: 'auth/callback',
  }),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
