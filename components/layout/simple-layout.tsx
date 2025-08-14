"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function SimpleLayout({ children, title }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 简化的顶部导航 */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Home 按钮 */}
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-8 pt-20 max-w-4xl">
        {title && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        )}
        
        <div className="prose prose-gray dark:prose-invert max-w-none">
          {children}
        </div>
      </main>

      {/* 简化的页脚 */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container py-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 RecipeEasy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
