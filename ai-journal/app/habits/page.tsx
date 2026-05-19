import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import HabitsPage from '@/components/habits/HabitsPage'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <HabitsPage />
}
