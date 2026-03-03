"use client";

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { CookingPot, ShoppingBasket, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { withLocalePath } from "@/lib/utils/locale-path";

interface TutorialStepProps {
  index: number;
  title: string;
  description: string;
  icon: ReactNode;
}

const hasStepPrefix = (value: string) => /^\s*\d{1,2}\s*[\.\-:)]\s*/.test(value);

const TutorialStep = ({ index, title, description, icon }: TutorialStepProps) => {
  const displayTitle = hasStepPrefix(title) ? title : `${index + 1}. ${title}`;

  return (
    <article className="group flex h-full flex-col gap-4 rounded-xl border border-border-70 bg-card-90 p-6 shadow-sm transition-colors duration-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
      </div>

      <h4 className="text-xl font-bold text-foreground">
        {displayTitle}
      </h4>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
};

export const TutorialSection = () => {
  const t = useTranslations('tutorial');
  const locale = useLocale();
  const router = useRouter();
  const navigateToWorkspace = () => {
    router.push(withLocalePath(locale, '/workspace'));
  };

  const tutorialSteps = [
    {
      title: t('step1.title'),
      description: t('step1.description'),
      icon: <ShoppingBasket className="h-7 w-7" />
    },
    {
      title: t('step2.title'),
      description: t('step2.description'),
      icon: <SlidersHorizontal className="h-7 w-7" />
    },
    {
      title: t('step3.title'), 
      description: t('step3.description'),
      icon: <CookingPot className="h-7 w-7" />
    }
  ];

  return (
    <section id="tutorial" className="py-10">
      <span id="features" className="sr-only" aria-hidden="true" />
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="home-section-header text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {locale === 'zh' ? '简单流程' : 'Simple Process'}
            </p>
            <h2 className="mx-auto mt-2 max-w-[720px] text-3xl font-black leading-tight text-foreground md:text-4xl">
              {t('title')}
            </h2>
            <p className="mx-auto mt-3 max-w-[600px] text-base leading-normal text-muted-foreground md:text-lg">
              {t('description')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {tutorialSteps.map((step, index) => (
              <TutorialStep key={index} index={index} {...step} />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={navigateToWorkspace}
              className="inline-flex h-12 min-w-[84px] cursor-pointer items-center justify-center rounded-lg bg-foreground px-8 text-base font-bold leading-normal tracking-[0.015em] text-background transition-colors hover:opacity-90"
            >
              {locale === 'zh' ? '立即体验' : 'Get Started for Free'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
