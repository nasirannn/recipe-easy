import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "Is this service completely free?",
    answer: "Yes, our AI Recipe Generator is completely free to use, but with a weekly limit. You get 7 free uses per week. Once you’ve used them up, another 7 free uses will be available the following week.",
    value: "item-1",
  },
  {
    question: "How reliable are the AI-generated recipes?",
    answer:
      "Our AI is trained on a vast global database of trusted recipes, mastering flavor combinations and cooking techniques to deliver consistently delicious results. That said, cooking is an art—so don’t hesitate to get creative and make each recipe your own!",
    value: "item-2",
  },
  {
    question:
      "Is my recipe content secure?",
    answer:
      "Your privacy is our priority. We DO NOT store any recipe data you generate. To preserve your creations, please save any recipes you want to keep to your local device.",
    value: "item-3",
  },
  {
    question: "How can I provide feedback or report issues?",
    answer: "We'd love to hear from you! Please share your feedback or report any problems by contacting our support team at annnb016@example.com. Your input helps us continuously improve our service.",
    value: "item-4",
  },
  {
    question:
      "How long does the transformation process take?",
    answer: "Most recipes are generated in 20-60 seconds. The exact time depends on the AI model selected and current server load. During peak hours, you may experience slightly longer wait times due to high demand.",
    value: "item-5",
  },
  {
    question:
      "Can I use the generated images commercially?",
    answer: "Yes.The generated images are free for both personal and commercial use, but please ensure not to infringe on other brands' copyright.",
    value: "item-6",
  }
];

export const FAQSection = () => {
  return (
    <section id="faq" className="container py-4 sm:py-12">
      <div className="text-center mb-16 ">
         <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          FAQ
        </h2>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-[90%] lg:max-w-[95%] mx-auto">
        {FAQList.map(({ question, answer }, index) => (
          <div key={question} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground font-semibold text-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {question}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
