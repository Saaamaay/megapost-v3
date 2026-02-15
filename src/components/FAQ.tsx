import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Will the posts actually sound like me?",
    answer:
      "Yes! During setup you define your tone, beliefs, and business context. The AI uses all of this to write in your unique voice — not generic marketing speak.",
  },
  {
    question: "What platforms are supported?",
    answer:
      "We currently generate posts for LinkedIn, Instagram, Facebook, X (Twitter), and Threads. Each post is specifically tailored to what performs best on that platform.",
  },
  {
    question: "What happens after the free trial?",
    answer:
      "After your 7-day trial you can choose a plan that fits your needs, starting at £10/mo. If you don't subscribe, you simply won't be able to generate new posts — but your existing posts and profile are always accessible.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. You can cancel from your account settings at any time. You'll keep access until the end of your billing period — no questions asked.",
  },
  {
    question: "Do I need to upload photos?",
    answer:
      "Photos are optional but recommended — they help the AI create more specific, engaging posts. You can also just describe what you want to share.",
  },
  {
    question: "What are content pillars?",
    answer:
      "Content pillars are recurring themes or topics for your brand. We generate these based on your business profile to help you stay consistent and never run out of ideas.",
  },
];

export function FAQ() {
  return (
    <section className="mt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          Frequently asked questions
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border px-6 data-[state=open]:shadow-card transition-shadow"
            >
              <AccordionTrigger className="text-left font-display font-bold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
