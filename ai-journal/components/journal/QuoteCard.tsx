"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getQuoteOfTheDay, QUOTE_CATEGORIES, type QuoteCategory } from "@/lib/quotes";

interface Props {
  date: string;
}

export default function QuoteCard({ date }: Props) {
  const [category, setCategory] = useState<QuoteCategory>("zen");

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quoteCategory") as QuoteCategory | null;
    if (saved && QUOTE_CATEGORIES.some(c => c.value === saved)) {
      setCategory(saved);
    }
  }, []);

  const changeCategory = (cat: QuoteCategory) => {
    setCategory(cat);
    localStorage.setItem("quoteCategory", cat);
  };

  const quote = getQuoteOfTheDay(date, category);

  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {QUOTE_CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => changeCategory(value)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs border transition-colors",
                category === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
        {/* Quote */}
        <blockquote className="space-y-1">
          <p className="text-sm leading-relaxed text-foreground italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="text-xs text-muted-foreground">— {quote.author}</footer>
        </blockquote>
      </CardContent>
    </Card>
  );
}
