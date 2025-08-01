"use client";

import { Badge } from '@/components/ui/badge';
import { Zap, Crown } from 'lucide-react';
import { useUserUsage } from '@/hooks/use-user-usage';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface UsageCounterProps {
  className?: string;
  compact?: boolean;
}

export function UsageCounter({
  className,
  compact = false
}: UsageCounterProps) {
  const { credits, loading } = useUserUsage();
  const t = useTranslations('credits');

  if (loading || !credits) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="outline" className="animate-pulse">
          <Zap className="h-3 w-3 mr-1" />
          Loading...
        </Badge>
      </div>
    );
  }
  const creditsCount = credits.credits;
  const isLowCredits = creditsCount <= 2 && creditsCount > 0;
  const isNoCredits = creditsCount === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge
        variant={isNoCredits ? "destructive" : isLowCredits ? "secondary" : "outline"}
        className={cn(
          "transition-colors duration-200",
          isLowCredits && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          !compact && "px-3 py-1"
        )}
      >
        <Zap className={cn("mr-1", compact ? "h-3 w-3" : "h-4 w-4")} />
        {compact ? (
          <span>{creditsCount}</span>
        ) : (
          <span>{creditsCount} {t('credits')}</span>
        )}
      </Badge>
    </div>
  );
}
