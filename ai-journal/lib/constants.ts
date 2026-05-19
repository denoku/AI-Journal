export const ALL_LIFE_AREAS = [
  'freelance',
  'dsa',
  'bike',
  'dogs',
  'daughter',
  'cats',
  'garden',
  'baking',
  'cooking',
  'reading',
  'show',
  'games',
  'coffee',
  'recipes',
  'brands',
  'compost',
  'lickmat',
  'learn',
] as const
export type LifeArea = (typeof ALL_LIFE_AREAS)[number]

export const TRACKED_HABITS = ['bike', 'dogs', 'dsa', 'reading', 'garden', 'daughter'] as const
export type TrackedHabit = (typeof TRACKED_HABITS)[number]

export const RECIPE_CATEGORIES = ['Pizza', 'Bread', 'Sweets', 'Coffee', 'Cooking', 'Other'] as const
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]

export const MAX_INTENTIONS = 5
