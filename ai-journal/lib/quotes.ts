export type QuoteCategory = "zen" | "stoic" | "motivational" | "random";

interface Quote {
  text: string;
  author: string;
}

const ZEN: Quote[] = [
  { text: "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.", author: "Zen Proverb" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "You are the sky. Everything else is just the weather.", author: "Pema Chödrön" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "If you understand, things are just as they are. If you do not understand, things are just as they are.", author: "Zen Proverb" },
  { text: "The present moment always will have been.", author: "Eckhart Tolle" },
  { text: "Wherever you are is the entry point.", author: "Kabir" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "In the beginner's mind there are many possibilities, in the expert's mind there are few.", author: "Shunryu Suzuki" },
  { text: "Let go or be dragged.", author: "Zen Proverb" },
  { text: "The obstacle is the path.", author: "Zen Proverb" },
  { text: "When you realize there is nothing lacking, the whole world belongs to you.", author: "Lao Tzu" },
  { text: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Each morning we are born again. What we do today is what matters most.", author: "Buddha" },
  { text: "Be here now.", author: "Ram Dass" },
  { text: "The flame that burns twice as bright burns half as long.", author: "Lao Tzu" },
  { text: "Knowing others is wisdom. Knowing yourself is enlightenment.", author: "Lao Tzu" },
  { text: "Three things cannot be long hidden: the sun, the moon, and the truth.", author: "Buddha" },
  { text: "Simplicity is the ultimate sophistication.", author: "Zen Proverb" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "No mud, no lotus.", author: "Thich Nhat Hanh" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Breathe. You are among the few who have survived everything you've been through.", author: "Zen Saying" },
  { text: "When walking, walk. When eating, eat.", author: "Zen Proverb" },
  { text: "Flow with whatever may happen and let your mind be free.", author: "Zhuangzi" },
  { text: "Do not be too timid and squeamish about your actions. All life is an experiment.", author: "Zen Saying" },
  { text: "Wherever you go, there you are.", author: "Jon Kabat-Zinn" },
  { text: "Empty your mind, be formless, shapeless — like water.", author: "Bruce Lee" },
  { text: "Act without expectation.", author: "Lao Tzu" },
];

const STOIC: Quote[] = [
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "First, say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "Amor fati — love your fate, which is in fact your life.", author: "Nietzsche" },
  { text: "He who laughs at himself never runs out of things to laugh at.", author: "Epictetus" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "The whole future lies in uncertainty: live immediately.", author: "Seneca" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
];

const MOTIVATIONAL: Quote[] = [
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Show up every day and just do the work.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Motivation gets you going. Discipline keeps you growing.", author: "John Maxwell" },
  { text: "Don't count the days. Make the days count.", author: "Muhammad Ali" },
  { text: "You are what you repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Every day is a second chance.", author: "Unknown" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
];

const ALL_QUOTES = [...ZEN, ...STOIC, ...MOTIVATIONAL];

function dayIndex(dateStr: string): number {
  // deterministic: hash the date string into an index
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getQuoteOfTheDay(date: string, category: QuoteCategory): Quote {
  const pool =
    category === "zen"
      ? ZEN
      : category === "stoic"
        ? STOIC
        : category === "motivational"
          ? MOTIVATIONAL
          : ALL_QUOTES;
  return pool[dayIndex(date) % pool.length];
}

export const QUOTE_CATEGORIES: { value: QuoteCategory; label: string; emoji: string }[] = [
  { value: "zen", label: "Zen", emoji: "🧘" },
  { value: "stoic", label: "Stoic", emoji: "⚔️" },
  { value: "motivational", label: "Motivated", emoji: "🔥" },
  { value: "random", label: "Random", emoji: "🎲" },
];
