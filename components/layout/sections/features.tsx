"use client";
import { useTranslations } from 'next-intl';
import { SectionHeader } from "@/components/layout/section-header";

import { Globe, Sparkles, Image as ImageIcon, Utensils, Pizza, Smartphone } from "lucide-react";

export const FeaturesSection = () => {
  const t = useTranslations('features');

  const features = [
    { 
      id: 1, 
      title: 'imageModels', 
      description: 'imageModelsDesc',
      icon: <ImageIcon className="h-6 w-6 text-secondary" />
    },
    { 
      id: 2, 
      title: 'aiGeneration', 
      description: 'aiGenerationDesc',
      icon: <Sparkles className="h-6 w-6 text-secondary" />
    },
    { 
      id: 3, 
      title: 'customIngredients', 
      description: 'customIngredientsDesc',
      icon: <Utensils className="h-6 w-6 text-secondary" />
    },
    { 
      id: 4, 
      title: 'multipleCuisine', 
      description: 'multipleCuisineDesc',
      icon: <Pizza className="h-6 w-6 text-secondary" />
    },
    { 
      id: 5, 
      title: 'multiLanguage', 
      description: 'multiLanguageDesc',
      icon: <Globe className="h-6 w-6 text-secondary" />
    },
    { 
      id: 6, 
      title: 'responsive', 
      description: 'responsiveDesc',
      icon: <Smartphone className="h-6 w-6 text-secondary" />
    }
  ];

  return (
    <section
      id="features"
      className="home-section"
    >
      <div className="home-inner">
        <SectionHeader
          eyebrow="Capabilities"
          title={t('title')}
          description={t('description')}
          className="mb-10 md:mb-14"
        />
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="home-card flex min-h-[220px] gap-4 p-6 transition-colors hover:border-primary/30"
            >
              <div className="shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  {feature.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {t(feature.title)}
                </h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {t(feature.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
