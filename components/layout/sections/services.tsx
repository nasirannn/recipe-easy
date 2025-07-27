import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from 'next-intl';

enum ProService {
  YES = 1,
  NO = 0,
}
interface ServiceProps {
  titleKey: string;
  pro: ProService;
  descriptionKey: string;
}
const serviceList: ServiceProps[] = [
  {
    titleKey: "aiGeneration",
    descriptionKey: "aiGenerationDesc",
    pro: 0,
  },
  {
    titleKey: "smartIngredient",
    descriptionKey: "smartIngredientDesc",
    pro: 0,
  },
  {
    titleKey: "multipleCuisine",
    descriptionKey: "multipleCuisineDesc",
    pro: 0,
  },
  {
    titleKey: "recipeImage",
    descriptionKey: "recipeImageDesc",
    pro: 1,
  },
  {
    titleKey: "dietaryFilter",
    descriptionKey: "dietaryFilterDesc",
    pro: 1,
  },
  {
    titleKey: "recipeSaving",
    descriptionKey: "recipeSavingDesc",
    pro: 1,
  },
];

export const ServicesSection = () => {
  const t = useTranslations('services');

  return (
    <section id="services" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        {t('title')}
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        {t('subtitle')}
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        {t('description')}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
        {serviceList.map(({ titleKey, descriptionKey, pro }) => (
          <Card
            key={titleKey}
            className="bg-muted/60 dark:bg-card h-full relative"
          >
            <CardHeader>
              <CardTitle>{t(titleKey)}</CardTitle>
              <CardDescription>{t(descriptionKey)}</CardDescription>
            </CardHeader>
            <Badge
              data-pro={ProService.YES === pro}
              variant="secondary"
              className="absolute -top-2 -right-3 data-[pro=false]:hidden"
            >
              PRO
            </Badge>
          </Card>
        ))}
      </div>
    </section>
  );
};
