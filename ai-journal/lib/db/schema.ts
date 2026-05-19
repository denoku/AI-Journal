import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    morningNote: text("morning_note"),
    intentions: jsonb("intentions").$type<string[]>(),
    meals: jsonb("meals").$type<{
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string;
    }>(),
    midCheck: text("mid_check"),
    eveningNote: text("evening_note"),
    wins: text("wins"),
    doneHabits: jsonb("done_habits").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date)],
);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  role: text("role").notNull().$type<"user" | "assistant">(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ingredients: text("ingredients"),
  steps: text("steps"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const coffeeLogs = pgTable(
  "coffee_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    slot: text("slot").notNull().$type<"morning" | "afternoon">(),
    beans: text("beans"), // e.g. "Ethiopia Yirgacheffe - Onyx"
    roaster: text("roaster"), // e.g. "Onyx Coffee Lab"
    doseG: text("dose_g"), // grams in (as text for flexibility e.g. "18.5")
    yieldG: text("yield_g"), // grams out
    timeSec: text("time_sec"), // pull time in seconds
    grindSetting: text("grind_setting"), // e.g. "15" or "fine"
    tastingNotes: text("tasting_notes"), // free text
    rating: text("rating"), // "1"–"5"
    brewMethod: text("brew_method"), // "espresso" | "pour over" | "aeropress" etc
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date, t.slot)],
);

export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type Meals = NonNullable<JournalEntry["meals"]>;
export type Recipe = InferSelectModel<typeof recipes>;
export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type CoffeeLog = InferSelectModel<typeof coffeeLogs>;
