"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

export function LanguageToggle({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const switchLanguage = useCallback((lang: 'en' | 'zh') => {
    // 替换路径中的第一个 /en 或 /zh
    const newPath = pathname.replace(/^\/(en|zh)/, `/${lang}`);
    router.push(newPath);
  }, [pathname, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage('en')} disabled={locale === 'en'}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage('zh')} disabled={locale === 'zh'}>
          中文
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}