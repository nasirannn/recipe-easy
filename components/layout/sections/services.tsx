import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

enum ProService {
  YES = 1,
  NO = 0,
}
interface ServiceProps {
  title: string;
  pro: ProService;
  description: string;
}
const serviceList: ServiceProps[] = [
  {
    title: "AI Recipe Generation",
    description:
      "Transform your available ingredients into delicious recipes using advanced AI technology.",
    pro: 0,
  },
  {
    title: "Smart Ingredient Recognition",
    description:
      "Intelligent ingredient suggestions and categorization to help you find the perfect combinations.",
    pro: 0,
  },
  {
    title: "Multiple Cuisine Styles",
    description: "Generate recipes from various cuisines including Chinese, Italian, Mexican, and more.",
    pro: 0,
  },
  {
    title: "Recipe Image Generation",
    description: "AI-powered food photography to visualize your recipes before cooking.",
    pro: 1,
  },
  {
    title: "Dietary Preference Filtering",
    description: "Customize recipes based on vegetarian, vegan, gluten-free, and other dietary needs.",
    pro: 1,
  },
  {
    title: "Recipe Saving & History",
    description: "Save your favorite recipes and access your generation history anytime.",
    pro: 1,
  },
];

export const ServicesSection = () => {
  return (
    <section id="services" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Services
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Powerful Recipe Features
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        From ingredient recognition to recipe generation, we provide everything you need to create amazing meals.
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
        {serviceList.map(({ title, description, pro }) => (
          <Card
            key={title}
            className="bg-muted/60 dark:bg-card h-full relative"
          >
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
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
