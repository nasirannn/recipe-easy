import Image from "next/image";
import { useTranslations } from "next-intl";

export const IntroduceSection = () => {
  const t = useTranslations("introduce");

  return (
    <section id="introduce" className="container py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">
            {t("title")}
          </h2>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("heading")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t("description1")}
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            {t("description2")}
          </p>
          <p className="text-lg text-muted-foreground mb-8">
            {t("description3")}
          </p>
        </div>

        <div className="w-full">
          <Image
            src="/images/introduce_fridge.jpg"
            alt={t("imageAlt")}
            width={600}
            height={400}
            className="rounded-lg shadow-lg"
            priority
          />
        </div>
      </div>
    </section>
  );
}; 