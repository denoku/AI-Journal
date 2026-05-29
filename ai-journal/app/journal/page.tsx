import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JournalPage from "@/components/journal/JournalPage";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/signin");
  // No date prop — JournalPage computes it client-side using the browser's
  // local timezone, avoiding server/UTC date mismatches after ~5pm on the West Coast.
  return <JournalPage />;
}
