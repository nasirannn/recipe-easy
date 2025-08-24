import Image from "next/image";
import { useTranslations } from "next-intl";

export const IntroductionSection = () => {
  const t = useTranslations("introduction");

  return (
    <section id="introduction" className="w-full py-16 sm:py-16 bg-[rgb(237,237,255)] dark:bg-[rgb(30,30,50)]">
      <div className="container">
        <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg overflow-hidden">
            {/* 背景纹理图片 */}
            <div className="absolute inset-0 pointer-events-none">
              <Image
                src="/images/ingredients-icon/grain-texture.png"
                alt=""
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
            <div className="relative z-10">
              <h2 className="text-lg text-secondary mb-2 tracking-wider">
                {t("title")}
              </h2>

              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {t("heading")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("description1")}
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                {t("description2")}
              </p>
            </div>
          </div>

          <div className="w-full">
            <Image
              src="/images/introduction_fridge.jpg"
              alt={t("imageAlt")}
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}; 