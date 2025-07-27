"use client";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { GridBackground } from "@/components/ui/grid-background";

export const FeaturesSection = () => {
  const t = useTranslations('features');

  const handleScrollToHero = () => {
    const heroSection = document.getElementById("hero");
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="features"
      className="w-full bg-primary/5 pt-32 pb-24 sm:pt-40 sm:pb-32 relative"
    >
      <GridBackground className="absolute inset-0 z-[-1]" />
      <div className="container grid lg:grid-cols-2 gap-8 place-items-center">
        <div className="lg:text-left text-center">
          <h2 className="text-lg text-base mb-2 tracking-wider">
            {t('subtitle')}
          </h2>

          <h2 className="text-3xl text-primary md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            {t('description')}
          </p>

          <Button className="rounded-full px-6" onClick={handleScrollToHero}>
            {t('tryNow')} &rarr;
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
