"use client";
import { Button } from "@/components/ui/button";

export const FeaturesSection = () => {

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
        Brand New AI Recipe Generator
          </h2>

          <h2 className="text-3xl text-primary md:text-4xl font-bold mb-4">
            {/* From Leftovers to Delicious Meals in a Snap */}
            Free Online AI Recipes Generator
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Simply select or enter the ingredients, and our AI will
            craft random,creative and easy-to-follow recipes for you. No more "What's for dinner?" stress.
          </p>

          <Button className="rounded-full px-6" onClick={handleScrollToHero}>Try It Now &rarr;</Button>
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
