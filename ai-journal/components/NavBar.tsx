"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Baby,
  CheckSquare,
  Coffee,
  ChefHat,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/baby", icon: Baby, label: "Baby" },
  { href: "/habits", icon: CheckSquare, label: "Habits" },
  { href: "/coffee", icon: Coffee, label: "Coffee" },
  { href: "/recipes", icon: ChefHat, label: "Recipes" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-[10px] transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
