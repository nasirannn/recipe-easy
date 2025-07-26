"use client";

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const languageNames = {
  en: 'English',
  zh: '中文',
} as const;

const languageFlags = {
  en: '🇺🇸',
  zh: '🇨🇳',
} as const;

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languageFlags[language]} {languageNames[language]}
          </span>
          <span className="sm:hidden">
            {languageFlags[language]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languageNames).map(([lang, name]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as 'en' | 'zh')}
            className={`gap-2 ${language === lang ? 'bg-accent' : ''}`}
          >
            <span>{languageFlags[lang as keyof typeof languageFlags]}</span>
            <span>{name}</span>
            {language === lang && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
