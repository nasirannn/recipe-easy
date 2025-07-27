import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const FooterSection = () => {
  const t = useTranslations('footer');

  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
          <Link href="/" className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8">
          <Image 
          src="/recipe-easy-logo.svg"
            alt="Logo"
            fill
            className="object-contain"
            sizes="(max-width: 640px) 28px, 32px"
          />
        </div>
        RecipeEasy
      </Link>
      <p className="text-sm text-muted-foreground mt-3 max-w-xs">
        {t('description')}
      </p>
          </div>

          <div className="flex flex-col gap-2">

          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('about')}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t('features')}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('platforms')}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t('web')}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('help')}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t('contact')}
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t('faq')}
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="">
          <h3 className="text-left text-gray-500">
            {t('copyright')}
            {/* <Link
              target="_blank"
              href="https://github.com/leoMirandaa"
              className="text-primary transition-all border-primary hover:border-b-2 ml-1"
            >
              Leo Miranda
            </Link> */}
          </h3>
        </section>
      </div>
    </footer>
  );
};
