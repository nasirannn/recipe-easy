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
    image: "https://i.pravatar.cc/150?img=35",
    nameKey: "review1.name",
    userNameKey: "review1.userName",
    commentKey: "review1.comment",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    nameKey: "review2.name",
    userNameKey: "review2.userName",
    commentKey: "review2.comment",
    rating: 4.8,
  },
  {
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    nameKey: "review3.name",
    userNameKey: "review3.userName",
    commentKey: "review3.comment",
    rating: 4.9,
  },
  {
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    nameKey: "review4.name",
    userNameKey: "review4.userName",
    commentKey: "review4.comment",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    nameKey: "review5.name",
    userNameKey: "review5.userName",
    commentKey: "review5.comment",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    nameKey: "review6.name",
    userNameKey: "review6.userName",
    commentKey: "review6.comment",
    rating: 4.9,
  },
];

export const TestimonialSection = () => {
  const t = useTranslations('testimonials');

  return (
    <section id="testimonials" className="container py-4 sm:py-12">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          {t('title')}
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          {t('subtitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviewData.map((review, index) => {
          const name = t(review.nameKey);
          const userName = t(review.userNameKey);
          const comment = t(review.commentKey);

          return (
            <Card
              key={index}
              className="bg-muted/50 dark:bg-card flex flex-col"
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
                <p className="text-muted-foreground">{`"${comment}"`}</p>
              </CardContent>
              <CardFooter>
                <div className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={review.image}
                      alt={userName}
                    />
                    <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{name}</CardTitle>
                    <CardDescription>{userName}</CardDescription>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
