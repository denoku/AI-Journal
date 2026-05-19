import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JournalPage from "@/components/journal/JournalPage";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/signin");

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
  return <JournalPage date={today} />;
}
