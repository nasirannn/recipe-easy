import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";
import Image from 'next/image';

interface TutorialStepProps {
  title: string;
  description: string;
  imageSrc: string;
}

const TutorialStep = ({ title, description, imageSrc }: TutorialStepProps) => {
  return (
    <Card className="bg-card p-6 h-full shadow-none">
      <div className="rounded-lg p-3 mb-4">
        <Image 
          src={imageSrc} 
          alt={title}
          width={200}
          height={100}
          className="w-full max-w-[200px] h-auto object-contain rounded-md mx-auto"
        />
      </div>
      
      <h4 className="text-xl font-bold mb-3 text-foreground text-center">
        {title}
      </h4>
      
      <p className="text-muted-foreground mb-4 leading-relaxed text-center">
        {description}
      </p>
    </Card>
  );
};

export const TutorialSection = () => {
  const t = useTranslations('tutorial');

  const tutorialSteps = [
    {
      title: t('step1.title'),
      description: t('step1.description'),
      imageSrc: "/images/tutorial_step_1.svg"
    },
    {
      title: t('step2.title'),
      description: t('step2.description'),
      imageSrc: "/images/tutorial_step_2.svg"
    },
    {
      title: t('step3.title'), 
      description: t('step3.description'),
      imageSrc: "/images/tutorial_step_3.svg"
    }
  ];

  return (
    <section id="tutorial" className="container pt-8 sm:pt-12 pb-8 sm:pb-12">
      <div className="text-center mb-16">
        <h3 className="text-3xl md:text-6xl font-bold text-foreground mb-4">
          {t('title')}
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tutorialSteps.map((step, index) => (
          <TutorialStep key={index} {...step} />
        ))}
      </div>
    </section>
  );
};
