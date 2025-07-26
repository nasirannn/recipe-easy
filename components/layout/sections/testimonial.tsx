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

interface ReviewProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
  rating: number;
}

const reviewList: ReviewProps[] = [
  {
    image: "https://i.pravatar.cc/150?img=35",
    name: "Jane Doe",
    userName: "Foodie Jane",
    comment:
      "This app is a lifesaver for dinner planning. I just input my ingredients and get delicious recipes my family loves. So easy!",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Mike T.",
    userName: "College Student",
    comment:
      "I'm not a great cook, but this app makes it so easy. The step-by-step instructions are super clear. I've actually started to enjoy cooking!",
    rating: 4.8,
  },
  {
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Jessica P.",
    userName: "Foodie on a Budget",
    comment:
      "I was tired of wasting food. This app helps me use up all my leftovers in creative ways. It's great for my wallet and the environment.",
    rating: 4.9,
  },
  {
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "David H.",
    userName: "Health Enthusiast",
    comment:
      "I love how I can filter for healthy options. The AI gives me great, balanced meal ideas that fit my dietary goals. Highly recommend!",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Emily R.",
    userName: "Kitchen Novice",
    comment:
      "I never knew I could make something so delicious with just a few ingredients. The pictures are also super helpful. This is my go-to app now.",
    rating: 5.0,
  },
  {
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "Chris G.",
    userName: "Remote Worker",
    comment:
      "Working from home, it's easy to get into a lunch rut. This app gives me quick and exciting ideas to break the monotony. It's fantastic!",
    rating: 4.9,
  },
];

export const TestimonialSection = () => {
  return (
    <section id="testimonials" className="container py-4 sm:py-12">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Testimonials
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          What Our Users Are Saying
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviewList.map((review) => (
          <Card
            key={review.name}
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
              <p className="text-muted-foreground">{`"${review.comment}"`}</p>
            </CardContent>
            <CardFooter>
              <div className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src={review.image}
                    alt={review.userName}
                  />
                  <AvatarFallback>{review.name.substring(0, 2)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <CardTitle className="text-lg">{review.name}</CardTitle>
                  <CardDescription>{review.userName}</CardDescription>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};
