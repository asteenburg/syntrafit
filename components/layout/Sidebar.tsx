"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Activity,
  LayoutDashboard,
  Dumbbell,
  Zap,
  BookOpen,
  ChartNoAxesCombined,
  Target,
  Ruler,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    title: "Training",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        enabled: true,
      },
      {
        name: "Generate",
        href: "/generator",
        icon: Zap,
        enabled: false,
      },
      {
        name: "Workouts",
        href: "/workouts",
        icon: Dumbbell,
        enabled: false,
      },
      {
        name: "Exercises",
        href: "/exercises",
        icon: BookOpen,
        enabled: true,
      },
    ],
  },
  {
    title: "Performance",
    items: [
      {
        name: "Progress",
        href: "/progress",
        icon: ChartNoAxesCombined,
        enabled: false,
      },
      {
        name: "Goals",
        href: "/goals",
        icon: Target,
        enabled: false,
      },
      {
        name: "Measurements",
        href: "/measurements",
        icon: Ruler,
        enabled: false,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        name: "Profile",
        href: "/profile",
        icon: User,
        enabled: true,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        enabled: false,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className='fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#111111] lg:flex'>
      {/* Logo */}
      <div className='px-6 py-8'>
        <Link
          href='/dashboard'
          className='flex items-center gap-2'
        >
          <Activity
            size={30}
            className='text-[#A4FF00]'
          />

          <span className='text-2xl font-bold tracking-tight'>
            Syntra
            <span className='text-[#A4FF00]'>Fit</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label='Main navigation'
        className='flex-1 space-y-8 overflow-y-auto px-4 py-2'
      >
        {navigation.map((group) => (
          <div key={group.title}>
            <p className='mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-500'>
              {group.title}
            </p>

            <div className='space-y-1'>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                const Icon = item.icon;

                if (!item.enabled) {
                  return (
                    <div
                      key={item.name}
                      aria-disabled='true'
                      title='Coming soon'
                      className='flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-600'
                    >
                      <Icon size={20} />
                      {item.name}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#A4FF00] text-black"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className='border-t border-white/10 p-4'>
        {error && (
          <p
            role='alert'
            className='mb-3 text-xs text-red-400'
          >
            {error}
          </p>
        )}

        <button
          type='button'
          onClick={handleSignOut}
          disabled={signingOut}
          className='flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50'
        >
          <LogOut size={20} />

          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
