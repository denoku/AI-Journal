import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RecipesPage from '@/components/recipes/RecipesPage'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <RecipesPage />
}
