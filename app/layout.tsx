import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
  description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — with easy cooking steps.",
  icons: {
    icon: "/recipe-easy-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
