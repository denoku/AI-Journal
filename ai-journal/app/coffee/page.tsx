import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CoffeePage from '@/components/coffee/CoffeePage'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <CoffeePage />
}
