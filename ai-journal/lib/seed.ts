import { db } from './db'
import { recipes } from './db/schema'
import { eq } from 'drizzle-orm'

export async function seedRecipesForUser(userId: string) {
  // Check if user already has recipes
  const existing = await db.select().from(recipes).where(eq(recipes.userId, userId)).limit(1)
  if (existing.length > 0) return

  await db.insert(recipes).values([
    {
      userId,
      title: 'Brown Butter Chocolate Chip Cookies',
      category: 'Sweets',
      ingredients: `2 1/4 cups (280g) all-purpose flour
1 tsp baking soda
1 tsp fine sea salt
1 cup (225g) unsalted butter
3/4 cup (150g) granulated sugar
3/4 cup (165g) packed brown sugar
2 large eggs
2 tsp vanilla extract
2 cups (340g) chocolate chips (60-70% dark)
Flaky sea salt for topping`,
      steps: `1. Brown the butter: Melt butter in a light-colored saucepan over medium heat, stirring frequently. Cook until it turns golden and smells nutty (about 5-7 min). Pour into a large bowl and let cool 15 min.
2. Whisk both sugars into the browned butter until combined. Add eggs one at a time, then vanilla. Whisk vigorously until smooth and slightly thick.
3. Stir in flour, baking soda, and salt until just combined. Fold in chocolate chips.
4. Chill dough covered at least 1 hour (overnight is better for flavor).
5. Preheat oven to 375°F. Scoop dough into balls (2 tbsp each) onto lined baking sheets, spaced 2 inches apart.
6. Bake 10-12 min until edges are golden but centers look slightly underdone.
7. Immediately sprinkle with flaky salt. Cool on pan 5 min before transferring.`,
      notes: 'The overnight chill is key — deeper caramel flavor and chewier texture. Pull from oven when still looking underdone; they firm up as they cool. Brown butter is non-negotiable.',
    },
    {
      userId,
      title: 'Drop Sugar Cookies',
      category: 'Sweets',
      ingredients: `2 3/4 cups (345g) all-purpose flour
1 tsp baking soda
1/2 tsp baking powder
1/2 tsp fine sea salt
1 cup (225g) unsalted butter, softened
1 1/2 cups (300g) granulated sugar, plus more for rolling
1 large egg
1 tsp vanilla extract
1/2 tsp almond extract (optional but good)`,
      steps: `1. Preheat oven to 375°F. Line baking sheets with parchment.
2. Whisk flour, baking soda, baking powder, and salt in a bowl.
3. Beat butter and sugar with a mixer until light and fluffy, about 3 min. Beat in egg, vanilla, and almond extract.
4. Add flour mixture and mix until just combined.
5. Scoop dough into 1.5 tbsp balls. Roll in sugar to coat.
6. Place on prepared sheets 2 inches apart. No flattening needed.
7. Bake 10-11 min until edges are just set and centers look puffy and underdone.
8. Cool on pan 5 min — they'll sink and get crinkly on top.`,
      notes: 'Drop style means no rolling or cutting — faster and crispier edges with a soft center. The almond extract adds a subtle depth without being obvious. Great canvas for colored sugar for holidays.',
    },
  ])
}
