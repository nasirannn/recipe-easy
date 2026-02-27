"use client";

import { Menu, LogOut, BookOpen, Star, HelpCircle, ChevronRight, ArrowRight, Compass } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from '@/hooks/use-user-usage';
import { getUserDisplayName } from '@/lib/utils/user-display';
import { EditUserInfoDialog } from '@/components/ui/edit-display-name-dialog';
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ToggleTheme } from "@/components/layout/toogle-theme";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { withLocalePath } from "@/lib/utils/locale-path";

interface RouteProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditUserInfoDialog, setShowEditUserInfoDialog] = useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, loading, signOut } = useAuth();
  const { credits } = useUserUsage();
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations('navigation');
  const tCredits = useTranslations('credits');
  const locale = useLocale();
  const isHomePage = pathname === `/${locale}` || pathname === "/";
  const homeHref = withLocalePath(locale);

  React.useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

  const actionButtonClassName = cn(
    "ml-1 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
    isHomePage
      ? "border-transparent bg-muted/56 hover:bg-muted/72"
      : "border-border/60 bg-background/70 hover:bg-accent/50"
  );

  const mobileTriggerClassName = cn(
    "h-10 w-10 cursor-pointer rounded-full border",
    isHomePage
      ? "border-transparent bg-muted/56 hover:bg-muted/72"
      : "border-border/60 bg-background/70 hover:bg-accent/50"
  );

  const avatarTriggerClassName = cn(
    "ml-1 h-11 w-11 cursor-pointer overflow-hidden rounded-full border p-0 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2",
    isHomePage
      ? "border-transparent bg-muted/56 hover:bg-muted/72"
      : "border-border/60 bg-background/70 hover:bg-accent/50",
    "data-[state=open]:border-primary/50 data-[state=open]:bg-primary/10"
  );

  const avatarMenuClassName = cn(
    "w-[19rem] rounded-2xl border p-2 shadow-lg backdrop-blur-xl",
    isHomePage
      ? "border-border/80 bg-background/92"
      : "border-border/70 bg-background/95"
  );

  // 添加调试信息
  React.useEffect(() => {
    if (loading) return;
    
    if (user) {
      // 检查是否是Google用户
      if (user.app_metadata?.provider === 'google') {
      }
    } else {
    }
  }, [user, loading]);

  // 如果当前路径包含隐私政策或服务条款，不显示导航栏
  if (pathname.includes('/privacy') || pathname.includes('/terms')) {
    return null;
  }

  const routeList: RouteProps[] = [
    { href: withLocalePath(locale, '/recipes'), label: t('explore'), icon: <Compass className="h-4 w-4" /> },
    { href: withLocalePath(locale, '#features'), label: t('features'), icon: <Star className="h-4 w-4" /> },
    { href: withLocalePath(locale, '#faq'), label: t('faq'), icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push(homeHref);
    } catch (error) {
      // Logout error
    }
  };

  // 处理编辑用户资料成功后的回调 - 简化版本
  const handleEditUserInfoSuccess = () => {
    // 用户数据会通过认证状态变化自动更新
  };

  return (
    <header
      className={cn(
        "z-50 w-full transition-[background-color,border-color,backdrop-filter,box-shadow] duration-300 ease-out motion-reduce:transition-none",
        isHomePage
          ? cn(
              "fixed inset-x-0 top-0",
              isScrolled
                ? "bg-background/80 shadow-[0_1px_0_rgba(15,23,42,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/68 dark:shadow-[0_1px_0_rgba(255,255,255,0.08)]"
                : "border-transparent bg-transparent backdrop-blur-0"
            )
          : "sticky top-0 border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      )}
    >
      <div className="home-inner">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={homeHref}
              className="flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-primary/5"
            >
              <div className="relative h-9 w-9">
              <Image
                src="/images/recipe-easy-logo.svg"
                alt="RecipeEasy"
                fill
                className="object-contain"
                sizes="36px"
              />
            </div>
              <span className="text-base font-semibold tracking-tight">
              RecipeEasy
            </span>
          </Link>

            <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            {routeList.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 py-2 transition-colors duration-200",
                    !route.href.includes('#') && pathname.startsWith(route.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  )}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

          <div className="flex items-center gap-2">
            {/* 桌面版功能区 */}
              <div className="hidden items-center gap-1.5 md:flex">
                <LanguageSwitcher />
                <ToggleTheme />
              </div>
              
              {/* 用户菜单 */}
              {!loading && (
                user ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={avatarTriggerClassName}
                      >
                        <UserAvatar user={user} size="lg" className="h-10 w-10" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={10}
                      className={avatarMenuClassName}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
                        <div className="flex items-start gap-3">
                          <UserAvatar user={user} size="lg" className="h-11 w-11" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {getUserDisplayName(user)}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 cursor-pointer rounded-md p-0 hover:bg-background/90"
                            onClick={() => setShowEditUserInfoDialog(true)}
                          >
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-lg bg-background/80 px-2.5 py-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t('credits')}
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {credits?.credits || 0}
                          </span>
                        </div>

                        <div className="mt-1.5 text-xs text-muted-foreground">
                          {tCredits('consumeOneCredit')}
                        </div>
                      </div>

                      <DropdownMenuSeparator className="my-2" />

                      <DropdownMenuItem
                        onClick={() => router.push(withLocalePath(locale, '/my-recipes'))}
                        className="cursor-pointer rounded-lg px-2.5 py-2.5"
                      >
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t('myRecipes')}</span>
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="mt-1 cursor-pointer rounded-lg px-2.5 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">{t('signout')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className={actionButtonClassName}
                  >
                    {t('signin')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )
              )}
            {/* 移动版汉堡菜单 */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={mobileTriggerClassName}
                    >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="flex flex-col p-0"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <SheetTitle className="sr-only">导航菜单</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* 移动版顶部 */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <Link href={homeHref} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                          <div className="relative w-8 h-8">
                            <Image
                              src="/images/recipe-easy-logo.svg"
                              alt="RecipeEasy"
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                          <span className="font-semibold text-lg">RecipeEasy</span>
                        </Link>
                      </div>
                    </div>
                    
                    {/* 移动版导航项 */}
                    <div className="p-4 flex-1 overflow-y-auto">
                      {!loading && user && (
                        <div className="mb-6 border-b border-border pt-2 pb-5">
                          <div className="flex items-center gap-3 mb-4">
                            <UserAvatar user={user} size="lg" className="h-10 w-10" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">
                                  {getUserDisplayName(user)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-accent cursor-pointer"
                                  onClick={() => setShowEditUserInfoDialog(true)}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          
                          {/* 移动端积分信息区域 */}
                          <div className="bg-accent/50 rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{t('credits')}</span>
                              </div>
                              <span className="font-semibold tabular-nums">
                                {credits?.credits || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">{t('totalEarned')}</span>
                              <span className="text-xs tabular-nums font-medium">
                                {credits?.total_earned || 0}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tCredits('consumeOneCredit')}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <nav className="space-y-1">
                        {routeList.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {route.icon}
                            <span className="ml-2">{route.label}</span>
                          </Link>
                        ))}
                        
                        {/* 我的菜谱链接 - 仅登录用户显示 */}
                        {!loading && user && (
                          <Link
                            href={withLocalePath(locale, '/my-recipes')}
                            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            {t('myRecipes')}
                          </Link>
                        )}
                      </nav>
                    </div>
                    
                    {/* 移动版底部操作区 */}
                    <div className="p-4 border-t mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm">{t('appearance')}</span>
                        <ToggleTheme />
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm">{t('language')}</span>
                        <LanguageSwitcher />
                      </div>
                      
                      {!loading && user && (
                        <Button
                          variant="outline"
                          className="w-full justify-center cursor-pointer"
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>{t('signout')}</span>
                        </Button>
                      )}
                      
                      {!loading && !user && (
                        <div
                          className="w-full text-center cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors duration-200 flex items-center justify-center gap-1.5 rounded-md"
                          onClick={() => {
                            setShowAuthModal(true);
                            setIsOpen(false);
                          }}
                        >
                          {t('signin')}
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      {/* 编辑用户信息对话框 */}
      <EditUserInfoDialog 
        open={showEditUserInfoDialog} 
        onOpenChange={setShowEditUserInfoDialog}
        user={user}
        onSuccess={handleEditUserInfoSuccess}
      />
    </header>
  );
}
