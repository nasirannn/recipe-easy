"use client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export const FeaturesSection = () => {
  const { t } = useLanguage();

  const handleScrollToHero = () => {
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="features"
      className="w-full bg-primary/5 py-24 sm:py-32"
    >
      <div className="container grid lg:grid-cols-2 gap-8 place-items-center">
        <div className="lg:text-left text-center">
          <h2 className="text-lg text-base mb-2 tracking-wider">
            {t('features.subtitle')}
          </h2>

          <h2 className="text-3xl text-primary md:text-4xl font-bold mb-4">
            {t('features.title')}
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            {t('features.description')}
          </p>

          <Button className="rounded-full px-6" onClick={handleScrollToHero}>
            {t('features.tryNow')} &rarr;
          </Button>
        </div>

        <div className="w-full aspect-video rounded-lg overflow-hidden">
          <iframe
            className="w-full h-full"
            title="vimeo-player"
            src="https://player.vimeo.com/video/1103051913?h=e71848409d&byline=0&portrait=0&title=0"
            
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  );
};
