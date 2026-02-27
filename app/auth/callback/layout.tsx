import type { Metadata } from 'next';
import { generateMetadata as generateSeoMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...generateSeoMetadata({
    title: 'Authentication Callback - RecipeEasy',
    description: 'Authentication callback endpoint for RecipeEasy sign-in flow.',
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
