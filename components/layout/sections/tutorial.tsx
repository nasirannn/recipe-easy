import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";
import Image from 'next/image';
import { SectionHeader } from '@/components/layout/section-header';

interface TutorialStepProps {
  index: number;
  title: string;
  description: string;
  imageSrc: string;
}

const TutorialStep = ({ index, title, description, imageSrc }: TutorialStepProps) => {
  return (
    <Card className="home-card h-full p-6 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
          {`0${index + 1}`.slice(-2)}
        </span>
      </div>

      <div className="mb-5 rounded-xl bg-background/70 p-3">
        <Image 
          src={imageSrc} 
          alt={title}
          width={240}
          height={120}
          className="mx-auto h-auto w-full max-w-[240px] rounded-md object-contain"
        />
      </div>
      
      <h4 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h4>
      
      <p className="mt-3 text-base leading-7 text-muted-foreground">
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
    <section id="tutorial" className="home-section">
      <div className="home-inner">
        <SectionHeader
          eyebrow="Workflow"
          title={t('title')}
          description={t('description')}
          className="home-section-header"
        />

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {tutorialSteps.map((step, index) => (
            <TutorialStep key={index} index={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};
