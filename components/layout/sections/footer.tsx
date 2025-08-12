"use client";

import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ContactDialog } from '@/components/ui/contact-dialog';

export const FooterSection = () => {
  const t = useTranslations('footer');
  const tContact = useTranslations('contactDialog');
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
          <Link href="/" className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8">
          <Image 
          src="/images/recipe-easy-logo.svg"
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
              <Link href="#features" className="opacity-60 hover:opacity-100">
                {t('features')}
              </Link>
            </div>
          </div>

          {/* <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('platforms')}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t('web')}
              </Link>
            </div>
          </div> */}

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('help')}</h3>
            <div>
              <button 
                onClick={() => setShowContactDialog(true)}
                className="opacity-60 hover:opacity-100 text-left bg-transparent border-none p-0 cursor-pointer"
              >
                {t('contact')}
              </button>
            </div>

            <div>
              <Link href="#faq" className="opacity-60 hover:opacity-100">
                {t('faq')}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t('featuredOn')}</h3>
            <div>
              <a 
                href="https://startupfa.me/s/recipe-easy.com?utm_source=recipe-easy.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <img 
                  src="https://startupfa.me/badges/featured-badge-small.webp" 
                  alt="Featured on Startup Fame" 
                  width="224" 
                  height="36" 
                  className="h-9 w-auto"
                />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="flex justify-between items-center">
          <h3 className="text-left text-gray-500">
            {t('copyright')}
          </h3>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">
              {t('terms')}
            </Link>
          </div>
        </section>
      </div>
      
      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        email="annnb016@gmail.com"
        subject={tContact('defaultSubject')}
        body={tContact('defaultBody')}
      />
    </footer>
  );
};
