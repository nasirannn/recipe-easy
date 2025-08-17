"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect, useCallback } from 'react';

interface ReviewProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
  rating: number;
}

interface ReviewData {
  image: string;
  nameKey: string;
  userNameKey: string;
  commentKey: string;
  rating: number;
}

const reviewData: ReviewData[] = [
  {
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review1.name",
    userNameKey: "review1.userName",
    commentKey: "review1.comment",
    rating: 5.0,
  },
  {
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review2.name",
    userNameKey: "review2.userName",
    commentKey: "review2.comment",
    rating: 4.8,
  },
  {
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review3.name",
    userNameKey: "review3.userName",
    commentKey: "review3.comment",
    rating: 4.9,
  },
  {
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review4.name",
    userNameKey: "review4.userName",
    commentKey: "review4.comment",
    rating: 5.0,
  },
  {
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review5.name",
    userNameKey: "review5.userName",
    commentKey: "review5.comment",
    rating: 5.0,
  },
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format",
    nameKey: "review6.name",
    userNameKey: "review6.userName",
    commentKey: "review6.comment",
    rating: 4.9,
  },
];

export const TestimonialSection = () => {
  const t = useTranslations('testimonials');
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const translateXRef = useRef(0);
  const [cardWidth, setCardWidth] = useState(350);

  // 创建重复的评价数据以实现无缝循环
  const duplicatedReviews = [...reviewData, ...reviewData];

  // 计算卡片宽度（响应式）
  useEffect(() => {
    const updateCardWidth = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) {
          setCardWidth(300); // 小屏幕
        } else if (window.innerWidth < 1024) {
          setCardWidth(320); // 中等屏幕
        } else {
          setCardWidth(350); // 大屏幕
        }
      }
    };

    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    
    return () => window.removeEventListener('resize', updateCardWidth);
  }, []);

  const animate = useCallback(() => {
    const container = containerRef.current;
    if (!container || isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // 计算单个评价卡片的宽度（包括间距）
    const gap = 32; // gap-8 = 2rem = 32px
    const cardTotalWidth = cardWidth + gap;
    
    // 计算一组评价的总宽度
    const singleGroupWidth = reviewData.length * cardTotalWidth;
    
    // 移动速度（像素/帧）- 根据屏幕尺寸调整，让动画更平滑
    const speed = window.innerWidth < 640 ? 0.6 : 0.8;
    
    translateXRef.current -= speed;
    
    // 当移动到第一组评价的末尾时，重置到开始位置
    if (translateXRef.current <= -singleGroupWidth) {
      translateXRef.current = 0;
    }
    
    container.style.transform = `translateX(${translateXRef.current}px)`;
    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused, cardWidth]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <section id="testimonials" className="container pt-8 pb-4 sm:pt-16 sm:pb-8">
      <div className="text-center mb-8">
        <h2 className="text-lg text-secondary text-center mb-2 tracking-wider">
          {t('title')}
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          {t('subtitle')}
        </h2>
      </div>

      <div className="relative overflow-hidden">
        {/* 渐变遮罩 - 左侧 */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
        
        {/* 渐变遮罩 - 右侧 */}
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* 轮播容器 */}
        <div 
          ref={containerRef}
          className="flex gap-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {duplicatedReviews.map((review, index) => {
            const name = t(review.nameKey);
            const userName = t(review.userNameKey);
            const comment = t(review.commentKey);

            return (
              <Card
                key={index}
                className="bg-muted/50 dark:bg-card flex flex-col h-full shrink-0"
                style={{ 
                  minWidth: `${cardWidth}px`, 
                  maxWidth: `${cardWidth}px` 
                }}
              >
                <CardHeader>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="size-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm sm:text-base">{`"${comment}"`}</p>
                </CardContent>
                <CardFooter>
                  <div className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src={review.image}
                        alt={userName}
                        onError={(e) => {
                          // 尝试备用头像
                          const fallbackImages = [
                            "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=0f172a&color=fff&size=150",
                            "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(name) + "&size=150"
                          ];
                          
                          const currentSrc = e.currentTarget.src;
                          const currentIndex = fallbackImages.findIndex(url => currentSrc.includes(url.split('?')[0]));
                          
                          if (currentIndex < fallbackImages.length - 1) {
                            e.currentTarget.src = fallbackImages[currentIndex + 1];
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
                        }}
                      />
                      <AvatarFallback className="bg-[--color-primary-10] text-primary font-semibold">
                        {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <CardTitle className="text-base sm:text-lg">{name}</CardTitle>
                      <CardDescription className="text-sm">{userName}</CardDescription>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
