"use client";
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from '@/components/layout/section-header';

interface FAQProps {
  questionKey: string;
  answerKey: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    questionKey: "q1",
    answerKey: "a1",
    value: "item-1",
  },
  {
    questionKey: "q2",
    answerKey: "a2",
    value: "item-2",
  },
  {
    questionKey: "q3",
    answerKey: "a3",
    value: "item-3",
  },
  {
    questionKey: "q4",
    answerKey: "a4",
    value: "item-4",
  },
  {
    questionKey: "q5",
    answerKey: "a5",
    value: "item-5",
  },
  {
    questionKey: "q6",
    answerKey: "a6",
    value: "item-6",
  }
];

export const FAQSection = () => {
  const t = useTranslations('faq');
  const [openItem, setOpenItem] = useState<string>("item-1"); // 默认展开第一项

  const toggleItem = (value: string) => {
    setOpenItem(openItem === value ? "" : value);
  };

  return (
    <section id="faq" className="home-section">
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionHeader
            eyebrow="FAQ"
            title={t('title')}
            className="home-section-header"
          />

          <div className="mx-auto max-w-4xl space-y-3">
            {FAQList.map(({ questionKey, answerKey, value }, index) => {
              const isOpen = openItem === value;
              return (
                <div key={value} className="home-card overflow-hidden">
                  <button
                    onClick={() => toggleItem(value)}
                    className="flex min-h-[56px] w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted-40 md:px-6"
                  >
                    <div className="flex items-center gap-4">
                      <span className="min-w-[2.5rem] text-lg font-bold tracking-tight text-primary md:text-xl">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      <h3 className="text-base font-semibold text-foreground md:text-lg">
                        {t(questionKey)}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 md:px-6 md:pb-6">
                        <p className="text-base leading-7 text-muted-foreground md:pl-[3.5rem]">
                          {t(answerKey)}
                        </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
