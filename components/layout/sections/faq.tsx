"use client";
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
    <section id="faq" className="w-full py-16 sm:py-16">
      <div className="container">
        <div className="text-center mb-16 ">
         <h2 className="text-lg text-secondary text-center mb-2 tracking-wider">
          FAQ
        </h2>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t('title')}
        </h2>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {FAQList.map(({ questionKey, answerKey, value }, index) => {
          const isOpen = openItem === value;
          return (
            <div key={value} className="border-b border-border">
              <button
                onClick={() => toggleItem(value)}
                className="w-full py-6 text-left hover:no-underline flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-foreground min-w-[3rem]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    {t(questionKey)}
                  </h3>
                </div>
                <div className="shrink-0">
                  {isOpen ? (
                    <ChevronUp className="h-6 w-6 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="pb-6">
                  <div className="ml-16">
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {t(answerKey)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
};
