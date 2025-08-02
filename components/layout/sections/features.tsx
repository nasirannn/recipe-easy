"use client";
import { useTranslations } from 'next-intl';
import { GridBackground } from "@/components/ui/grid-background";
import { Globe, Sparkles, Image, Utensils, Pizza, Smartphone } from "lucide-react";

export const FeaturesSection = () => {
  const t = useTranslations('features');

  const features = [
    { 
      id: 1, 
      title: 'imageModels', 
      description: 'imageModelsDesc',
      icon: <Image className="h-6 w-6 text-primary" />
    },
    { 
      id: 2, 
      title: 'aiGeneration', 
      description: 'aiGenerationDesc',
      icon: <Sparkles className="h-6 w-6 text-primary" />
    },
    { 
      id: 3, 
      title: 'customIngredients', 
      description: 'customIngredientsDesc',
      icon: <Utensils className="h-6 w-6 text-primary" />
    },
    { 
      id: 4, 
      title: 'multipleCuisine', 
      description: 'multipleCuisineDesc',
      icon: <Pizza className="h-6 w-6 text-primary" />
    },
    { 
      id: 5, 
      title: 'multiLanguage', 
      description: 'multiLanguageDesc',
      icon: <Globe className="h-6 w-6 text-primary" />
    },
    { 
      id: 6, 
      title: 'responsive', 
      description: 'responsiveDesc',
      icon: <Smartphone className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <section
      id="features"
      className="w-full py-24 bg-background relative"
    >
      <GridBackground className="absolute inset-0 z-[-1] opacity-50" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="flex gap-4 p-6 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {t(feature.title)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
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
