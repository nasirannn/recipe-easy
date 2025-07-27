import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

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

  return (
    <section id="faq" className="container py-4 sm:py-12">
      <div className="text-center mb-16 ">
         <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          FAQ
        </h2>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t('title')}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-[90%] lg:max-w-[95%] mx-auto">
        {FAQList.map(({ questionKey, answerKey }, index) => (
          <div key={questionKey} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground font-semibold text-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t(questionKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(answerKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
