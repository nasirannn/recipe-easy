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
    <section id="faq" className="w-full bg-primary/5 py-4 sm:py-12">
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
            <div key={value} className="bg-background/50 rounded-lg">
              <button
                onClick={() => toggleItem(value)}
                className="w-full px-6 py-4 text-left hover:no-underline flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-secondary font-semibold text-sm">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${isOpen ? 'text-primary' : 'text-foreground'}`}>
                    {t(questionKey)}
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  {isOpen ? (
                                      <ChevronUp className={`h-5 w-5 ${isOpen ? 'text-secondary' : 'text-muted-foreground'}`} />
                ) : (
                  <ChevronDown className={`h-5 w-5 ${isOpen ? 'text-secondary' : 'text-muted-foreground'}`} />
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="px-6 pb-4">
                  <div className="ml-12">
                    <p className="text-muted-foreground leading-relaxed">
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
