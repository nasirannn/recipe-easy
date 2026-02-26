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
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
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

  const currentLanguageName = locale === 'zh' ? '中文' : 'English';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Switch language. Current: ${currentLanguageName}`}
          className={cn(
            "h-10 w-10 cursor-pointer rounded-full transition-colors duration-200 hover:bg-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
            className
          )}
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center text-[13px] font-semibold leading-none tracking-tight text-foreground"
          >
            A文
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 rounded-xl border border-border/70 bg-card p-2 text-foreground shadow-lg"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={(e) => {
              e.preventDefault();
              switchLanguage(language.code);
            }}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors duration-200 hover:bg-accent"
          >
            <span
              className={cn(
                "text-sm",
                locale === language.code ? "text-primary" : "text-foreground"
              )}
            >
              {language.name}
            </span>
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
