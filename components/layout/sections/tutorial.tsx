import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";
import { Upload, ChefHat, Download } from "lucide-react";
import Image from 'next/image';

interface TutorialStepProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  imageSrc: string;
}

const TutorialStep = ({ step, title, description, icon, imageSrc }: TutorialStepProps) => {
  return (
    <Card className="bg-card border-2 border-border rounded-xl p-6 h-full">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-secondary">
          {step}
        </h3>
      </div>
      
      <h4 className="text-xl font-bold mb-3 text-foreground">
        {title}
      </h4>
      
      <p className="text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      
      <div className="bg-muted rounded-lg p-3">
        <Image 
          src={imageSrc} 
          alt={title}
          width={400}
          height={200}
          className="w-full h-auto object-contain rounded-md"
        />
      </div>
    </Card>
  );
};

export const TutorialSection = () => {
  const t = useTranslations('tutorial');

  const tutorialSteps = [
    {
      step: "01",
      title: t('step1.title'),
      description: t('step1.description'),
      icon: <Upload className="w-5 h-5 text-secondary" />,
      imageSrc: "/images/tutorial_step_1.png"
    },
    {
      step: "02", 
      title: t('step2.title'),
      description: t('step2.description'),
      icon: <ChefHat className="w-5 h-5 text-secondary" />,
      imageSrc: "/images/tutorial_step_2.png"
    },
    {
      step: "03",
      title: t('step3.title'), 
      description: t('step3.description'),
      icon: <Download className="w-5 h-5 text-secondary" />,
      imageSrc: "/images/tutorial_step_3.png"
    }
  ];

  return (
    <section id="tutorial" className="container py-24 sm:py-32">
      <div className="text-center mb-16">
        <h2 className="text-lg text-secondary mb-2 tracking-wider font-medium">
          {t('subtitle')}
        </h2>
        <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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
