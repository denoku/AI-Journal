import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WeeklyPage from '@/components/weekly/WeeklyPage'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <WeeklyPage />
}
