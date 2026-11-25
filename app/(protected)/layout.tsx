import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className='min-h-screen bg-[#080808] text-white'>
      <Sidebar />

      <div className='min-h-screen pb-28 lg:pb-0 lg:pl-64'>{children}</div>

      <div data-testid='mobile-nav-wrapper'>
        <MobileNav />
      </div>
    </div>
  );
}
