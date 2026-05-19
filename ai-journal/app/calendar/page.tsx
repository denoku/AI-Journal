import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CalendarPage from '@/components/calendar/CalendarPage'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <CalendarPage />
}
