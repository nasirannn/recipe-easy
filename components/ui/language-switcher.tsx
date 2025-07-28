"use client";

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    // Handle case where locale might be undefined or not in path
    let pathWithoutLocale = pathname;
    if (locale && pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.replace(`/${locale}`, '');
    } else if (pathname === '/' || pathname === '') {
      pathWithoutLocale = '';
    }

    // Use window.location.href for full page reload to ensure proper language switching
    const newUrl = `/${newLocale}${pathWithoutLocale}`;
    window.location.href = newUrl;
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-accent/50 transition-colors duration-200 rounded-full px-3 py-2"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline font-medium">
            {currentLanguage?.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 p-2 bg-background/95 backdrop-blur-md border shadow-xl rounded-xl"
        sideOffset={8}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={cn(
              "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 font-medium",
              locale === language.code
                ? "bg-primary/10 text-primary shadow-sm"
                : "hover:bg-accent text-foreground"
            )}
          >
            <span className="text-sm">{language.name}</span>
            {locale === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
