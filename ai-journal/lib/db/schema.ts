import {
  pgTable,
  serial,
  text,
  jsonb,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
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
    date: text("date").notNull(),
    slot: text("slot").notNull().$type<"morning" | "afternoon">(),
    beans: text("beans"),
    roaster: text("roaster"),
    doseG: text("dose_g"),
    yieldG: text("yield_g"),
    timeSec: text("time_sec"),
    grindSetting: text("grind_setting"),
    tastingNotes: text("tasting_notes"),
    rating: text("rating"),
    brewMethod: text("brew_method"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date, t.slot)],
);

// Daily tasks / to-do items
export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD — the day this task belongs to
  text: text("text").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Baby activity log
export const babyLogs = pgTable("baby_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  // type: sleep_start / sleep_end / feed / diaper
  type: text("type")
    .notNull()
    .$type<"sleep_start" | "sleep_end" | "feed" | "diaper">(),
  time: timestamp("time").notNull(), // exact time of the event
  notes: text("notes"), // e.g. "5 oz formula", "very wet"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Foods tried by baby
export const babyFoods = pgTable("baby_foods", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  dateTried: text("date_tried").notNull(), // YYYY-MM-DD
  reaction: text("reaction").$type<
    "loved" | "liked" | "neutral" | "disliked" | "allergic"
  >(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generic key-value user settings (baby DOB, etc.)
export const userSettings = pgTable(
  "user_settings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.key)],
);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD (the exact date)
  title: text("title").notNull(),
  notes: text("notes"),
  type: text("type")
    .$type<"reminder" | "birthday" | "event">()
    .notNull()
    .default("reminder"),
  isRecurring: boolean("is_recurring").default(false).notNull(), // true = repeats yearly (for birthdays)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type Meals = NonNullable<JournalEntry["meals"]>;
export type Recipe = InferSelectModel<typeof recipes>;
export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type CoffeeLog = InferSelectModel<typeof coffeeLogs>;
export type Todo = InferSelectModel<typeof todos>;
export type BabyLog = InferSelectModel<typeof babyLogs>;
export type BabyFood = InferSelectModel<typeof babyFoods>;
export type UserSetting = InferSelectModel<typeof userSettings>;
export type CalendarEvent = InferSelectModel<typeof events>;
