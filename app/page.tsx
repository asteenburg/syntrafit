"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Dumbbell,
  Zap,
  Target,
  ChartNoAxesCombined,
  Timer,
  Menu,
  X,
  ChevronRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Intelligent Workouts",
    description:
      "Personalized workouts built around your goals, experience, available equipment and schedule.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Track Your Progress",
    description:
      "Monitor your performance, track your lifts and see how far you've come.",
  },
  {
    icon: Target,
    title: "Train With Purpose",
    description:
      "Focus on the muscle groups and training styles that matter most to you.",
  },
];

const categories = [
  {
    title: "Strength",
    description: "Build muscle. Get stronger.",
    icon: Dumbbell,
  },
  {
    title: "Conditioning",
    description: "Push your endurance.",
    icon: Activity,
  },
  {
    title: "HIIT",
    description: "Maximum intensity.",
    icon: Zap,
  },
  {
    title: "Quick Workouts",
    description: "Make every minute count.",
    icon: Timer,
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className='min-h-screen overflow-hidden bg-[#080808] text-white selection:bg-[#A4FF00] selection:text-black'>
      {/* NAVIGATION */}
      <header className='sticky top-0 z-50 border-b border-white/10 bg-[#080808]/80 backdrop-blur-xl'>
        <nav className='mx-auto flex h-20 max-w-7xl items-center justify-between px-6'>
          <Link
            href='/'
            className='flex items-center gap-2'
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#A4FF00] text-black'>
              <Activity
                size={25}
                strokeWidth={3}
              />
            </div>

            <span className='text-2xl font-black tracking-tight'>
              Syntra<span className='text-[#A4FF00]'>Fit</span>
            </span>
          </Link>

          <div className='hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex'>
            <Link
              href='#features'
              className='transition hover:text-white'
            >
              Features
            </Link>
            <Link
              href='#training'
              className='transition hover:text-white'
            >
              Training
            </Link>
            <Link
              href='#about'
              className='transition hover:text-white'
            >
              About
            </Link>
          </div>

          <div className='hidden items-center gap-5 md:flex'>
            <Link
              href='/login'
              className='text-sm font-medium'
            >
              Sign In
            </Link>

            <Link
              href='/signup'
              className='rounded-full bg-[#A4FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#baff40]'
            >
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className='md:hidden'
            aria-label='Toggle navigation'
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {menuOpen && (
          <div className='space-y-5 border-t border-white/10 p-6 md:hidden'>
            {["Features", "Training", "About"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className='block text-zinc-300'
              >
                {item}
              </Link>
            ))}

            <Link
              href='/login'
              className='block'
            >
              Sign In
            </Link>

            <Link
              href='/signup'
              className='block rounded-full bg-[#A4FF00] py-3 text-center font-bold text-black'
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className='relative'>
        <div className='pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-[#A4FF00]/10 blur-[150px]' />

        <div className='relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2'>
          <div>
            <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-[#A4FF00]/20 bg-[#A4FF00]/5 px-4 py-2 text-xs font-semibold tracking-widest text-[#A4FF00]'>
              <span className='h-2 w-2 rounded-full bg-[#A4FF00]' />
              THE NEXT GENERATION OF FITNESS
            </div>

            <h1 className='text-6xl font-black leading-[0.95] tracking-tighter sm:text-7xl lg:text-8xl'>
              Train smarter.
              <br />
              <span className='text-[#A4FF00]'>Become stronger.</span>
            </h1>

            <p className='mt-8 max-w-xl text-lg leading-relaxed text-zinc-400'>
              Your goals. Your pace. Your potential. SyntraFit brings
              intelligent workout planning, performance tracking and
              personalized fitness together in one powerful platform.
            </p>

            <div className='mt-10 flex flex-wrap gap-4'>
              <Link
                href='/signup'
                className='flex items-center gap-3 rounded-full bg-[#A4FF00] px-8 py-4 font-bold text-black transition hover:bg-[#baff40]'
              >
                Start Training
                <ArrowRight size={20} />
              </Link>

              <Link
                href='#features'
                className='rounded-full border border-white/15 px-8 py-4 font-semibold transition hover:bg-white/5'
              >
                Explore Features
              </Link>
            </div>

            <div className='mt-8 flex flex-wrap gap-5 text-sm text-zinc-500'>
              <span className='flex items-center gap-2'>
                <Check
                  size={16}
                  className='text-[#A4FF00]'
                />
                Personalized training
              </span>

              <span className='flex items-center gap-2'>
                <Check
                  size={16}
                  className='text-[#A4FF00]'
                />
                Built for every level
              </span>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className='relative mx-auto w-full max-w-lg'>
            <div className='absolute inset-0 rounded-[40px] bg-[#A4FF00]/10 blur-3xl' />

            <div className='relative rounded-[32px] border border-white/10 bg-[#111111] p-6 shadow-2xl sm:p-8'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-zinc-500'>Your fitness journey</p>
                  <h2 className='mt-1 text-2xl font-bold'>Performance</h2>
                </div>

                <div className='rounded-xl bg-[#A4FF00]/10 p-3 text-[#A4FF00]'>
                  <Activity />
                </div>
              </div>

              <div className='mt-8 rounded-2xl border border-white/5 bg-[#191919] p-5'>
                <div className='flex justify-between'>
                  <div>
                    <p className='text-sm text-zinc-400'>Weekly activity</p>
                    <p className='mt-2 text-4xl font-black'>
                      284
                      <span className='ml-2 text-sm font-medium text-zinc-500'>
                        min
                      </span>
                    </p>
                  </div>

                  <span className='text-sm font-bold text-[#A4FF00]'>+18%</span>
                </div>

                <div className='mt-6 flex h-28 items-end gap-3'>
                  {[40, 65, 45, 90, 60, 100, 75].map((height, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t-md ${
                        index === 5 ? "bg-[#A4FF00]" : "bg-[#A4FF00]/25"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className='mt-3 flex justify-between text-xs text-zinc-500'>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <span key={index}>{day}</span>
                  ))}
                </div>
              </div>

              <div className='mt-4 grid grid-cols-2 gap-4'>
                <div className='rounded-2xl bg-[#191919] p-5'>
                  <Dumbbell className='mb-4 text-[#A4FF00]' />
                  <p className='text-3xl font-black'>12</p>
                  <p className='mt-1 text-xs text-zinc-500'>
                    Workouts completed
                  </p>
                </div>

                <div className='rounded-2xl bg-[#191919] p-5'>
                  <Target className='mb-4 text-[#A4FF00]' />
                  <p className='text-3xl font-black'>85%</p>
                  <p className='mt-1 text-xs text-zinc-500'>Weekly goal</p>
                </div>
              </div>

              <div className='mt-4 flex items-center justify-between rounded-2xl bg-[#A4FF00] p-5 text-black'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wider'>
                    Today's workout
                  </p>
                  <p className='mt-1 text-xl font-black'>Upper Body Strength</p>
                  <p className='mt-1 text-sm opacity-70'>
                    45 min · Intermediate
                  </p>
                </div>
                <ArrowUpRight size={28} />
              </div>

              <p className='mt-4 text-center text-xs text-zinc-600'>
                Illustrative dashboard preview
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STRIP */}
      <section className='border-y border-white/10 bg-white/[0.02]'>
        <div className='mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 text-center md:grid-cols-4'>
          {[
            ["Your Goals", "Personalized"],
            ["Your Schedule", "Flexible"],
            ["Your Progress", "Measurable"],
            ["Your Potential", "Unlimited"],
          ].map(([title, subtitle]) => (
            <div key={title}>
              <p className='text-xl font-black sm:text-2xl'>{title}</p>
              <p className='mt-2 text-xs font-medium uppercase tracking-widest text-[#A4FF00]'>
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id='features'
        className='mx-auto max-w-7xl scroll-mt-24 px-6 py-28'
      >
        <div className='mb-14 max-w-2xl'>
          <p className='text-sm font-bold uppercase tracking-widest text-[#A4FF00]'>
            Built around you
          </p>

          <h2 className='mt-4 text-4xl font-black tracking-tight sm:text-5xl'>
            Everything you need.
            <br />
            Nothing holding you back.
          </h2>

          <p className='mt-5 leading-relaxed text-zinc-400'>
            A smarter approach to fitness that adapts to your lifestyle and
            evolves with your progress.
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className='group rounded-3xl border border-white/10 bg-[#111111] p-8 transition hover:border-[#A4FF00]/40'
              >
                <div className='mb-8 inline-flex rounded-2xl bg-[#A4FF00]/10 p-4 text-[#A4FF00]'>
                  <Icon size={28} />
                </div>

                <h3 className='text-2xl font-bold'>{feature.title}</h3>

                <p className='mt-4 leading-relaxed text-zinc-400'>
                  {feature.description}
                </p>

                <ArrowUpRight className='mt-8 text-zinc-600 transition group-hover:text-[#A4FF00]' />
              </div>
            );
          })}
        </div>
      </section>

      {/* TRAINING CATEGORIES */}
      <section
        id='training'
        className='scroll-mt-20 border-y border-white/5 bg-[#0d0d0d]'
      >
        <div className='mx-auto max-w-7xl px-6 py-24'>
          <p className='text-sm font-bold uppercase tracking-widest text-[#A4FF00]'>
            Find your training style
          </p>

          <h2 className='mt-4 text-4xl font-black tracking-tight sm:text-5xl'>
            Your workout. Your rules.
          </h2>

          <div className='mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  href='/signup'
                  key={category.title}
                  className='group flex min-h-56 flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1b1b] to-[#111111] p-6 transition hover:border-[#A4FF00]/50'
                >
                  <div className='flex items-center justify-between'>
                    <Icon
                      size={32}
                      className='text-[#A4FF00]'
                    />
                    <ChevronRight className='text-zinc-500 group-hover:text-[#A4FF00]' />
                  </div>

                  <div>
                    <h3 className='text-2xl font-bold'>{category.title}</h3>
                    <p className='mt-2 text-sm text-zinc-400'>
                      {category.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT / CALL TO ACTION */}
      <section
        id='about'
        className='mx-auto max-w-7xl scroll-mt-24 px-6 py-24'
      >
        <div className='relative overflow-hidden rounded-[40px] bg-[#A4FF00] px-8 py-20 text-center text-black sm:px-16'>
          <Activity
            size={400}
            strokeWidth={0.5}
            className='pointer-events-none absolute -right-24 -top-20 opacity-10'
          />

          <div className='relative'>
            <p className='text-sm font-bold uppercase tracking-[0.2em]'>
              Your next chapter starts here
            </p>

            <h2 className='mx-auto mt-6 max-w-3xl text-5xl font-black leading-none tracking-tighter sm:text-7xl'>
              Stronger than yesterday.
            </h2>

            <p className='mx-auto mt-6 max-w-xl text-lg text-black/70'>
              Take control of your fitness. Build better habits. Unlock your
              potential with SyntraFit.
            </p>

            <Link
              href='/signup'
              className='mt-10 inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 font-bold text-white transition hover:bg-zinc-800'
            >
              Join SyntraFit
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='border-t border-white/10'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row'>
          <Link
            href='/'
            className='flex items-center gap-2'
          >
            <Activity
              size={26}
              className='text-[#A4FF00]'
            />
            <span className='text-xl font-black'>
              Syntra<span className='text-[#A4FF00]'>Fit</span>
            </span>
          </Link>

          <div className='flex gap-6 text-sm text-zinc-500'>
            <Link
              href='/privacy'
              className='hover:text-white'
            >
              Privacy
            </Link>
            <Link
              href='/terms'
              className='hover:text-white'
            >
              Terms
            </Link>
            <Link
              href='/contact'
              className='hover:text-white'
            >
              Contact
            </Link>
          </div>

          <p className='text-xs text-zinc-600'>
            &copy; 2026 SyntraFit. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
