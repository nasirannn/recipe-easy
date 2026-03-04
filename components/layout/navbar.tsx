"use client";

import { Menu, LogOut, BookOpen, Star, HelpCircle, ChevronRight, ArrowRight, Compass, Coins, User, CirclePlus, CalendarDays } from "lucide-react";
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
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, loading, signOut } = useAuth();
  const { credits } = useUserUsage();
  const [isOpen, setIsOpen] = React.useState(false);
  const avatarMenuCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations('navigation');
  const tCredits = useTranslations('credits');
  const locale = useLocale();
  const homeHref = withLocalePath(locale);
  const myCookbookPath = withLocalePath(locale, "/my-cookbook");
  const myMealPlansPath = withLocalePath(locale, "/meal-plans");
  const workspacePath = withLocalePath(locale, "/workspace");
  const mealPlanPath = withLocalePath(locale, "/meal-plan");
  const pricingPath = withLocalePath(locale, "/pricing");
  const menuThemeTokenClassName = "theme-surface-base";

  const clearAvatarMenuCloseTimer = React.useCallback(() => {
    if (!avatarMenuCloseTimerRef.current) return;
    clearTimeout(avatarMenuCloseTimerRef.current);
    avatarMenuCloseTimerRef.current = null;
  }, []);

  const openAvatarMenu = React.useCallback(() => {
    clearAvatarMenuCloseTimer();
    setIsAvatarMenuOpen(true);
  }, [clearAvatarMenuCloseTimer]);

  const scheduleAvatarMenuClose = React.useCallback(() => {
    clearAvatarMenuCloseTimer();
    avatarMenuCloseTimerRef.current = setTimeout(() => {
      setIsAvatarMenuOpen(false);
      avatarMenuCloseTimerRef.current = null;
    }, 120);
  }, [clearAvatarMenuCloseTimer]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const actionButtonClassName = cn(
    "inline-flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2",
    "bg-primary text-primary-foreground hover:bg-primary/90"
  );

  const mobileTriggerClassName = cn(
    "h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent transition-colors",
    "text-foreground hover:text-primary"
  );

  const avatarTriggerClassName = cn(
    "h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 p-0 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2",
    "border-primary/30 bg-background-72 hover:border-primary/75",
    "data-[state=open]:border-primary"
  );
  const createRecipeButtonClassName = cn(
    "hidden h-10 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-bold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2 md:inline-flex",
    "bg-primary text-primary-foreground hover:bg-primary/90"
  );

  const avatarMenuClassName = cn(
    "w-[14.5rem] rounded-2xl border p-3 shadow-lg backdrop-blur-xl",
    menuThemeTokenClassName,
    "border-border-80 bg-background-92"
  );
  const avatarMenuSeparatorClassName = cn(
    "my-2.5",
    "bg-border-70"
  );
  const avatarMenuItemClassName = cn(
    "cursor-pointer rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
    "text-foreground focus:bg-muted-60"
  );
  const avatarMenuDangerItemClassName = cn(
    "cursor-pointer rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
    "text-destructive focus:bg-destructive/10 focus:text-destructive"
  );
  const avatarLabelTextClassName = cn(
    "text-sm font-medium",
    "text-foreground"
  );
  const avatarSubtleTextClassName = cn(
    "text-muted-foreground",
    "text-muted-foreground"
  );
  const avatarProgressTrackClassName = cn(
    "h-1.5 w-full overflow-hidden rounded-full",
    "bg-primary/20"
  );
  const avatarProgressBarClassName = cn(
    "h-full rounded-full transition-all duration-300",
    "bg-primary"
  );
  const mobileSheetContentClassName = cn(
    "flex flex-col p-0",
    menuThemeTokenClassName
  );
  const mobileSheetSectionBorderClassName = cn(
    "border-b",
    "border-border"
  );
  const mobileSheetFooterBorderClassName = cn(
    "border-t",
    "border-border"
  );
  const mobileUserPanelClassName = cn(
    "mb-6 pt-2 pb-5",
    mobileSheetSectionBorderClassName
  );
  const mobileUserNameClassName = cn(
    "font-semibold",
    "text-foreground"
  );
  const mobileSubtleTextClassName = cn(
    "text-xs",
    "text-muted-foreground"
  );
  const mobileEditProfileButtonClassName = cn(
    "h-5 w-5 cursor-pointer p-0",
    "hover:bg-accent"
  );
  const mobileCreditsCardClassName = cn(
    "rounded-md p-3",
    "bg-accent-50"
  );
  const mobileCreditsTrackClassName = cn(
    "mt-2 h-1.5 w-full overflow-hidden rounded-full",
    "bg-primary/20"
  );
  const mobileCreditsBarClassName = cn(
    "h-full rounded-full transition-all duration-300",
    "bg-primary"
  );
  const mobileNavLinkBaseClassName = cn(
    "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
  );
  const mobileNavLinkIdleClassName = cn(
    "text-foreground hover:bg-accent hover:text-primary"
  );
  const mobileNavLinkActiveClassName = cn(
    "bg-accent text-primary"
  );
  const mobileFooterLabelClassName = cn(
    "text-sm",
    "text-foreground"
  );
  const mobileSignOutButtonClassName = cn(
    "w-full justify-center cursor-pointer"
  );
  const mobileSignInButtonClassName = cn(
    "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-4 py-3 text-center text-sm font-medium transition-colors duration-200",
    "text-foreground hover:bg-accent-50"
  );
  const creditBalance = Number(credits?.credits ?? 0);
  const creditProgressMax = 3;
  const creditProgress = Math.min(
    100,
    Math.max(0, (creditBalance / creditProgressMax) * 100)
  );
  const formattedCreditBalance = Number.isInteger(creditBalance)
    ? String(creditBalance)
    : creditBalance.toFixed(1);
  const creditProgressLabel = `${formattedCreditBalance}/${creditProgressMax}`;

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

  React.useEffect(() => {
    return () => {
      if (!avatarMenuCloseTimerRef.current) return;
      clearTimeout(avatarMenuCloseTimerRef.current);
      avatarMenuCloseTimerRef.current = null;
    };
  }, []);

  // 专注页面不显示导航栏
  if (pathname.endsWith('/auth')) {
    return null;
  }

  const routeList: RouteProps[] = [
    { href: mealPlanPath, label: t('mealPlan'), icon: <CalendarDays className="h-4 w-4" /> },
    { href: withLocalePath(locale, '/explore'), label: t('explore'), icon: <Compass className="h-4 w-4" /> },
    { href: pricingPath, label: t('buyCredits'), icon: <Coins className="h-4 w-4" /> },
    { href: withLocalePath(locale, '#features'), label: t('features'), icon: <Star className="h-4 w-4" /> },
    { href: withLocalePath(locale, '#faq'), label: t('faq'), icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const desktopNavLinkBaseClassName = cn(
    "nav-link-text text-sm font-medium leading-normal tracking-normal transition-colors",
    "hover:text-foreground"
  );

  const desktopNavLinkIdleClassName = "";

  const desktopNavLinkActiveClassName = "text-foreground";
  const logoTextClassName = "nav-logo-text";

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
        "sticky top-0 z-50 w-full whitespace-nowrap border-b border-solid px-4 py-3 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none md:px-10",
        menuThemeTokenClassName,
        isScrolled
          ? "border-border-80 bg-background shadow-sm"
          : "border-border-70 bg-background"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link
              href={homeHref}
              className="flex items-center gap-3 transition-colors"
            >
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg"
                  alt="RecipeEasy"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <span className={logoTextClassName}>
                RecipeEasy
              </span>
            </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 md:gap-8">
          <nav className="hidden items-center gap-6 md:flex">
            {routeList.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  desktopNavLinkBaseClassName,
                  !route.href.includes('#') && pathname.startsWith(route.href)
                    ? desktopNavLinkActiveClassName
                    : desktopNavLinkIdleClassName
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* 桌面版功能区 */}
            <div className="hidden items-center gap-1.5 md:flex">
                <LanguageSwitcher />
                <ToggleTheme />
            </div>

              {/* 用户菜单 */}
              {!loading && (
                user ? (
                  <>
                    <Link
                      href={workspacePath}
                      className={createRecipeButtonClassName}
                    >
                      <CirclePlus className="h-4.5 w-4.5" />
                      <span>{t("newRecipe")}</span>
                    </Link>
                    <DropdownMenu
                      modal={false}
                      open={isAvatarMenuOpen}
                      onOpenChange={(open) => {
                        clearAvatarMenuCloseTimer();
                        setIsAvatarMenuOpen(open);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={avatarTriggerClassName}
                          onMouseEnter={openAvatarMenu}
                          onMouseLeave={scheduleAvatarMenuClose}
                        >
                          <UserAvatar user={user} size="lg" className="h-10 w-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={10}
                        className={cn(
                          avatarMenuClassName,
                          "data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100",
                          "data-[side=bottom]:slide-in-from-top-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0 data-[side=top]:slide-in-from-bottom-0"
                        )}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                        onMouseEnter={openAvatarMenu}
                        onMouseLeave={scheduleAvatarMenuClose}
                      >
                        <div className="space-y-3 py-1">
                          <div className="space-y-1.5">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {getUserDisplayName(user)}
                            </p>
                            <p className={cn("line-clamp-2 break-all text-xs leading-4", avatarSubtleTextClassName)}>
                              {user.email}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className={cn("inline-flex items-center gap-1.5 font-medium", avatarLabelTextClassName)}>
                                <Coins className={cn("h-3.5 w-3.5", avatarSubtleTextClassName)} />
                                {t('credits')}
                              </span>
                              <span className="font-semibold tabular-nums text-foreground">
                                {creditProgressLabel}
                              </span>
                            </div>
                            <div className={avatarProgressTrackClassName}>
                              <div
                                className={avatarProgressBarClassName}
                                style={{ width: `${creditProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <DropdownMenuSeparator className={avatarMenuSeparatorClassName} />

                        <DropdownMenuItem
                          onClick={() => setShowEditUserInfoDialog(true)}
                          className={avatarMenuItemClassName}
                        >
                          <User className={cn("h-4 w-4", avatarSubtleTextClassName)} />
                          {t('profile')}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            router.push(withLocalePath(locale, '/my-cookbook'));
                          }}
                          className={avatarMenuItemClassName}
                        >
                          <BookOpen className={cn("h-4 w-4", avatarSubtleTextClassName)} />
                          {t('myRecipes')}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            router.push(myMealPlansPath);
                          }}
                          className={avatarMenuItemClassName}
                        >
                          <CalendarDays className={cn("h-4 w-4", avatarSubtleTextClassName)} />
                          {t('myMealPlans')}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            router.push(pricingPath);
                          }}
                          className={avatarMenuItemClassName}
                        >
                          <Coins className={cn("h-4 w-4", avatarSubtleTextClassName)} />
                          {t('buyCredits')}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className={avatarMenuSeparatorClassName} />

                        <DropdownMenuItem
                          onClick={handleLogout}
                          className={avatarMenuDangerItemClassName}
                        >
                          <LogOut className="h-4 w-4 text-destructive" />
                          {t('signout')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className={actionButtonClassName}
                  >
                    {t('getStarted')}
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
                  className={mobileSheetContentClassName}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <SheetTitle className="sr-only">导航菜单</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* 移动版顶部 */}
                    <div className={cn("p-4", mobileSheetSectionBorderClassName)}>
                      <div className="flex items-center justify-between">
                        <Link href={homeHref} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                          <div className="relative w-8 h-8">
                            <Image
                              src="/logo.svg"
                              alt="RecipeEasy"
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                          <span className={logoTextClassName}>RecipeEasy</span>
                        </Link>
                      </div>
                    </div>
                    
                    {/* 移动版导航项 */}
                    <div className="p-4 flex-1 overflow-y-auto">
                      {!loading && user && (
                        <div className={mobileUserPanelClassName}>
                          <div className="flex items-center gap-3 mb-4">
                            <UserAvatar user={user} size="lg" className="h-10 w-10" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className={mobileUserNameClassName}>
                                  {getUserDisplayName(user)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={mobileEditProfileButtonClassName}
                                  onClick={() => setShowEditUserInfoDialog(true)}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className={cn("truncate max-w-[200px]", mobileSubtleTextClassName)}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                          
                          {/* 移动端积分信息区域 */}
                          <div className={mobileCreditsCardClassName}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm text-foreground">
                                  {t('credits')}
                                </span>
                              </div>
                              <span className="font-semibold tabular-nums text-foreground">
                                {creditProgressLabel}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={mobileSubtleTextClassName}>{t('totalEarned')}</span>
                              <span className="text-xs tabular-nums font-medium text-foreground">
                                {credits?.total_earned || 0}
                              </span>
                            </div>
                            <div className={mobileSubtleTextClassName}>
                              {tCredits('consumeOneCredit')}
                            </div>
                            <div className={mobileCreditsTrackClassName}>
                              <div
                                className={mobileCreditsBarClassName}
                                style={{ width: `${creditProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <nav className="space-y-1">
                        {routeList.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                              mobileNavLinkBaseClassName,
                              !route.href.includes('#') && pathname.startsWith(route.href)
                                ? mobileNavLinkActiveClassName
                                : mobileNavLinkIdleClassName
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            {route.icon}
                            <span className="ml-2">{route.label}</span>
                          </Link>
                        ))}
                        
                        {/* 我的菜谱链接 - 仅登录用户显示 */}
                        {!loading && user && (
                          <>
                            <Link
                              href={withLocalePath(locale, '/my-cookbook')}
                              className={cn(
                                mobileNavLinkBaseClassName,
                                pathname === myCookbookPath
                                  ? mobileNavLinkActiveClassName
                                  : mobileNavLinkIdleClassName
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              {t('myRecipes')}
                            </Link>
                            <Link
                              href={myMealPlansPath}
                              className={cn(
                                mobileNavLinkBaseClassName,
                                pathname.startsWith(myMealPlansPath)
                                  ? mobileNavLinkActiveClassName
                                  : mobileNavLinkIdleClassName
                              )}
                              onClick={() => setIsOpen(false)}
                            >
                              <CalendarDays className="mr-2 h-4 w-4" />
                              {t('myMealPlans')}
                            </Link>
                          </>
                        )}
                      </nav>
                    </div>
                    
                    {/* 移动版底部操作区 */}
                    <div className={cn("p-4 mt-auto", mobileSheetFooterBorderClassName)}>
                      <div className="flex items-center justify-between mb-4">
                        <span className={mobileFooterLabelClassName}>{t('appearance')}</span>
                        <ToggleTheme />
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className={mobileFooterLabelClassName}>{t('language')}</span>
                        <LanguageSwitcher />
                      </div>
                      
                      {!loading && user && (
                        <Button
                          variant="outline"
                          className={mobileSignOutButtonClassName}
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
                          className={mobileSignInButtonClassName}
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
        themeClassName={menuThemeTokenClassName}
      />
    </header>
  );
}
