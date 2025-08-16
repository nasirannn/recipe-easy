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
    <footer id="footer" className="container pt-8 pb-16 sm:pt-8 sm:pb-16">
      <div className="p-10 bg-card rounded-2xl">
        {/* Main content grid - two columns layout with right content grouped */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* First column: Logo and description */}
          <div className="md:col-span-1 text-center md:text-left">
            <Link href="/" className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2 justify-center md:justify-start">
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
            <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto md:mx-0">
              {t('description')}
            </p>
          </div>

          {/* Second column: About, Help, and Friend sections grouped together */}
          <div className="md:col-span-1">
            <div className="flex gap-6 md:gap-8 justify-center md:justify-end">
              {/* About section */}
              <div className="flex flex-col gap-2 flex-shrink-0 text-center md:text-left">
                <h3 className="font-bold text-lg">{t('about')}</h3>
                <div>
                  <Link href="#features" className="opacity-60 hover:opacity-100">
                    {t('features')}
                  </Link>
                </div>
              </div>

              {/* Help section */}
              <div className="flex flex-col gap-2 flex-shrink-0 text-center md:text-left">
                <h3 className="font-bold text-lg">{t('help')}</h3>
                <div>
                  <button 
                    onClick={() => setShowContactDialog(true)}
                    className="opacity-60 hover:opacity-100 text-center md:text-left bg-transparent border-none p-0 cursor-pointer"
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

              {/* Friend section */}
              <div className="flex flex-col gap-2 flex-shrink-0 text-center md:text-left">
                <h3 className="font-bold text-lg">{t('friends')}</h3>
                <div>
                  <a 
                    href="https://aiketorecipes.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-60 hover:opacity-100"
                  >
                    AI Keto Recipes
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright and legal links */}
        <Separator className="my-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-left text-gray-500 text-sm">
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
        </div>

        {/* Badges section */}
        <Separator className="my-6" />
        <div className="flex justify-center items-center gap-6">
          <a 
            href="https://startupfa.me/s/recipe-easy.com?utm_source=recipe-easy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://startupfa.me/badges/featured/default-small.webp" 
              alt="Featured on Startup Fame" 
              width={224}
              height={36}
              className="h-9 w-auto"
              unoptimized
            />
          </a>
          <a 
            href="https://www.producthunt.com/products/recipeeasy?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-recipeeasy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001064&theme=light&t=1754981113114" 
              alt="RecipeEasy - AI Recipe Generator - Turn ingredients into recipe instantly | Product Hunt" 
              width={250}
              height={54}
              className="h-9 w-auto"
              unoptimized
            />
          </a>
          <a 
            href="https://fazier.com/launches/recipe-easy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" 
              alt="Fazier badge" 
              width={120}
              height={36}
              className="h-9 w-auto"
              unoptimized
            />
          </a>
          <a 
            href="https://tinylaunch.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://tinylaunch.com/tinylaunch_badge_featured_on.svg"
              alt="TinyLaunch Badge"
              width={202}
              height={36}
              className="h-9 w-auto"
              unoptimized
            />
          </a>
        </div>
      </div>

      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        email="contact@recipe-easy.com"
        subject={tContact('defaultSubject')}
        body={tContact('defaultBody')}
      />
    </footer>
  );
};
