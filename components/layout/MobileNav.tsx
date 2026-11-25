"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Dumbbell,
  Zap,
  BookOpen,
  User,
  Book,
} from "lucide-react";

const navigation = [
  {
    name: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    name: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
    enabled: false,
  },
  {
    name: "Generate",
    href: "/generator",
    icon: Zap,
    enabled: false,
  },
  {
    name: "Exercises",
    href: "/exercises",
    icon: BookOpen,
    enabled: true,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    enabled: false,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label='Mobile navigation'
      className='fixed inset-x-0 bottom-0 z-50 px-3 pb-3 lg:hidden'
    >
      <div className='mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-[#171717]/95 px-2 py-2 shadow-2xl backdrop-blur-xl'>
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          const isGenerator = item.name === "Generate";

          const content = (
            <>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isGenerator
                    ? "bg-[#A4FF00] text-black"
                    : active
                      ? "text-[#A4FF00]"
                      : "text-zinc-500"
                }`}
              >
                <Icon size={22} />
              </div>

              <span
                className={`text-[10px] font-medium ${
                  active ? "text-[#A4FF00]" : "text-zinc-500"
                }`}
              >
                {item.name}
              </span>
            </>
          );

          if (!item.enabled) {
            return (
              <div
                key={item.name}
                aria-disabled='true'
                title='Coming soon'
                className='flex flex-1 cursor-not-allowed flex-col items-center gap-1'
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className='flex flex-1 flex-col items-center gap-1'
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
