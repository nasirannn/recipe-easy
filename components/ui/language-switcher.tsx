"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { withLocalePath } from '@/lib/utils/locale-path';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const switchLanguage = (newLocale: string) => {
    let pathWithoutLocale = pathname || '/';

    if (pathWithoutLocale === '/en' || pathWithoutLocale === '/zh') {
      pathWithoutLocale = '/';
    } else if (pathWithoutLocale.startsWith('/en/')) {
      pathWithoutLocale = pathWithoutLocale.replace(/^\/en/, '');
    } else if (pathWithoutLocale.startsWith('/zh/')) {
      pathWithoutLocale = pathWithoutLocale.replace(/^\/zh/, '');
    }

    const newUrl = withLocalePath(newLocale, pathWithoutLocale);
    setIsSwitching(true);
    router.push(newUrl);
  };

  const nextLocale = locale === 'zh' ? 'en' : 'zh';

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      disabled={isSwitching}
      aria-label={`Switch language to ${nextLocale === 'zh' ? 'Chinese' : 'English'}`}
      onClick={() => switchLanguage(nextLocale)}
      className={cn(
        "h-10 w-10 cursor-pointer rounded-full transition-colors duration-200 hover:bg-transparent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      <Languages aria-hidden="true" className="h-[18px] w-[18px] text-foreground" />
    </Button>
  );
}

export default LanguageSwitcher;
