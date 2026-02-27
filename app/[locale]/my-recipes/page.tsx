"use client";
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Recipe, UserLoginStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChefHat, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { FooterSection } from '@/components/layout/sections/footer';
import { RecipeListCard, RecipeListCardSkeleton } from '@/components/recipe/recipe-list-card';

interface RecipeWithMetadata extends Recipe {
  createdAt?: string;
  userStatus?: UserLoginStatus;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';
const masonryMediaClasses = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-square', 'aspect-[10/13]'] as const;

function normalizeDifficulty(value?: string): DifficultyLevel {
  const normalized = (value || '').toLowerCase();
  if (normalized === '简单' || normalized.includes('easy')) return 'easy';
  if (normalized === '困难' || normalized.includes('hard')) return 'hard';
  return 'medium';
}

function getMasonryMediaClass(seed: string | number): string {
  const source = String(seed);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return masonryMediaClasses[hash % masonryMediaClasses.length];
}

export default function MyRecipesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('myRecipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const isZh = locale.toLowerCase().startsWith('zh');
  const pageSize = 12;
  const [recipes, setRecipes] = useState<RecipeWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeWithMetadata | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(Math.max(page, 1), totalPages);
  const paginationStart = Math.max(1, Math.min(safeCurrentPage - 2, Math.max(totalPages - 4, 1)));
  const paginationEnd = Math.min(totalPages, paginationStart + 4);
  const visiblePages = Array.from(
    { length: paginationEnd - paginationStart + 1 },
    (_, index) => paginationStart + index
  );
  const pageCopy = isZh
    ? {
        subtitle: '管理你生成和保存过的菜谱，随时回看做法、难度和份量。',
        totalLabel: '总数',
        pageLabel: '页数',
      }
    : {
        subtitle: 'Review, manage, and revisit the recipes you generated with full cooking details.',
        totalLabel: 'Total',
        pageLabel: 'Page',
      };
  
  // 处理未登录用户的重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}`);
    }
  }, [authLoading, user, router, locale]);
  
  const loadRecipes = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/recipes/user/${user.id}?page=${page}&limit=${pageSize}&lang=${locale}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json() as any;
      setRecipes(data.recipes || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      // Failed to load recipes
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, t, locale, pageSize]);
  
  useEffect(() => {
    // 用户、语言或分页变化时重新拉取
    if (user?.id) {
      loadRecipes();
    }
  }, [user?.id, page, locale, loadRecipes]);

  // 页面可见性变化时，可以选择性地刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        // 页面重新可见时，可以选择刷新数据（可选）
        // 这里暂时不自动刷新，保持缓存
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);
  
  const handleDeleteClick = (recipe: RecipeWithMetadata) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    
    try {
      setDeleting(recipeToDelete.id);
      const response = await fetch(`/api/recipes/${recipeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      
      toast.success(t('deleteSuccess'));
      await loadRecipes(); // 删除后刷新列表
    } catch (error) {
      // Failed to delete recipe
      toast.error(t('deleteError'));
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return locale === 'zh' ? '今天' : 'Today';
    if (diffDays === 1) return locale === 'zh' ? '昨天' : 'Yesterday';
    if (diffDays < 7) return locale === 'zh' ? `${diffDays}天前` : `${diffDays} days ago`;
    
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPageHeader = (count: number) => (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {pageCopy.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 text-muted-foreground">
            <span className="font-medium">{pageCopy.totalLabel}</span>
            <span className="font-semibold text-foreground tabular-nums">{count}</span>
          </span>
          {total > pageSize && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 text-muted-foreground">
              <span className="font-medium">{pageCopy.pageLabel}</span>
              <span className="font-semibold text-foreground tabular-nums">{safeCurrentPage}/{totalPages}</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );

  const renderPageShell = (children: ReactNode, showFooter = false) => (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
        {children}
      </div>
      {showFooter && <FooterSection />}
    </div>
  );

  const renderRecipeGridSkeleton = () => (
    <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <RecipeListCardSkeleton
          key={`my-recipes-skeleton-${index}`}
          layout="overlay"
          mediaClassName={getMasonryMediaClass(index)}
          className="mb-6 break-inside-avoid"
        />
      ))}
    </div>
  );

  // 显示用户加载状态
  if (authLoading) {
    return renderPageShell(
      <>
        {renderPageHeader(total)}
        <div className="space-y-8">
          {renderRecipeGridSkeleton()}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>
        </div>
      </>
    );
  }

  // 如果用户未登录，显示加载状态等待重定向
  if (!authLoading && !user) {
    return renderPageShell(
      <div className="space-y-8">
        {renderRecipeGridSkeleton()}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-56 rounded-full" />
        </div>
      </div>
    );
  }
  
  if (loading) {
    return renderPageShell(
      <>
        {renderPageHeader(total)}
        <div className="space-y-8">
          {renderRecipeGridSkeleton()}
          <div className="flex justify-center">
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>
        </div>
      </>,
      true
    );
  }

  return renderPageShell(
    <>
      {renderPageHeader(total)}

      {recipes.length === 0 ? (
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-3xl border border-border/75 bg-card/95 p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/8">
              <ChefHat className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t('emptyState.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t('emptyState.description')}
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="h-11 bg-linear-to-r from-primary to-[--color-primary-90] px-6"
              >
                <Link href={`/${locale}`}>{t('emptyState.action')}</Link>
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {recipes.map((recipe) => {
              const normalizedDifficulty = normalizeDifficulty(recipe.difficulty);
              return (
                <RecipeListCard
                  key={recipe.id}
                  recipe={recipe}
                  href={`/${locale}/recipe/${recipe.id}?source=my-recipes`}
                  minsLabel={tRecipe('mins')}
                  difficultyLabel={recipe.difficulty ? tRecipe(normalizedDifficulty) : undefined}
                  layout="overlay"
                  mediaClassName={getMasonryMediaClass(recipe.id)}
                  className="mb-6 break-inside-avoid"
                  topLeftContent={
                    recipe.createdAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-slate-950/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(recipe.createdAt)}
                      </span>
                    ) : undefined
                  }
                  topRightContent={
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={t('delete')}
                      className="h-9 w-9 cursor-pointer rounded-full border border-white/35 bg-destructive/90 text-destructive-foreground shadow-md transition-all duration-200 hover:bg-destructive md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(recipe);
                      }}
                      disabled={deleting === recipe.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                  }
                />
              );
            })}
          </div>

          {total > pageSize && (
            <div className="mt-8 border-t border-border/70 pt-6">
              <p className="text-center text-sm text-muted-foreground">
                {isZh ? `第 ${safeCurrentPage} / ${totalPages} 页` : `Page ${safeCurrentPage} of ${totalPages}`}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="h-10 px-4"
                >
                  {t('pagination.previous')}
                </Button>

                {visiblePages.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={safeCurrentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="h-10 w-10"
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="h-10 px-4"
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              {t('deleteDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('deleteDialog.description', { title: recipeToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting === recipeToDelete?.id}
              className="flex-1"
            >
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting === recipeToDelete?.id}
              className="flex-1"
            >
              {deleting === recipeToDelete?.id ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>,
    true
  );
}
