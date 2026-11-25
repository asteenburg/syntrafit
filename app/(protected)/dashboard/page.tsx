import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  Dumbbell,
  CalendarDays,
  Clock,
  Target,
  ArrowRight,
  Zap,
} from "lucide-react";

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Calculate the beginning of the current week (UTC).
  const weekStart = new Date();
  const day = weekStart.getUTCDay();

  weekStart.setUTCDate(weekStart.getUTCDate() - ((day + 6) % 7));

  weekStart.setUTCHours(0, 0, 0, 0);

  // Retrieve dashboard data.
  const [
    profileResult,
    workoutsResult,
    weeklyResult,
    trainingResult,
    goalsResult,
    recentResult,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),

    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed"),

    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", weekStart.toISOString()),

    supabase
      .from("workouts")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .eq("status", "completed"),

    supabase
      .from("fitness_goals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),

    supabase
      .from("workouts")
      .select("id, name, workout_type, duration_seconds, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  // Check for database errors.
  const results = [
    profileResult,
    workoutsResult,
    weeklyResult,
    trainingResult,
    goalsResult,
    recentResult,
  ];

  if (results.some((result) => result.error)) {
    console.error(
      "Dashboard query errors:",
      results.map((result) => result.error),
    );

    return (
      <main className='p-8'>
        <h1 className='text-2xl font-bold'>Unable to load dashboard</h1>

        <p className='mt-3 text-red-400'>
          A database error occurred. Please try again.
        </p>
      </main>
    );
  }

  const firstName =
    profileResult.data?.full_name?.trim().split(/\s+/)[0] || "Athlete";

  const totalSeconds = (trainingResult.data ?? []).reduce(
    (total, workout) => total + (workout.duration_seconds ?? 0),
    0,
  );

  const totalMinutes = Math.floor(totalSeconds / 60);

  const recentWorkouts = recentResult.data ?? [];

  const stats = [
    {
      label: "Total Workouts",
      value: workoutsResult.count ?? 0,
      icon: Dumbbell,
    },
    {
      label: "This Week",
      value: weeklyResult.count ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Training Time",
      value: `${totalMinutes} min`,
      icon: Clock,
    },
    {
      label: "Active Goals",
      value: goalsResult.count ?? 0,
      icon: Target,
    },
  ];

  return (
    <main className='min-h-screen bg-[#080808] text-white'>
      <div className='mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12'>
        {/* Branding */}
        <div className='mb-10 flex items-center gap-2'>
          <Activity
            size={30}
            className='text-[#A4FF00]'
          />

          <span className='text-2xl font-bold tracking-tight'>
            Syntra
            <span className='text-[#A4FF00]'>Fit</span>
          </span>
        </div>

        {/* Welcome */}
        <section className='mb-8'>
          <p className='mb-2 text-xs font-semibold tracking-widest text-[#A4FF00]'>
            YOUR FITNESS JOURNEY
          </p>

          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
            Welcome back, {firstName}.
          </h1>

          <p className='mt-3 text-zinc-400'>
            Every workout brings you closer to your goals.
          </p>
        </section>

        {/* Featured workout */}
        <section className='relative mb-8 overflow-hidden rounded-3xl bg-[#A4FF00] p-7 text-black sm:p-10'>
          <Zap
            size={220}
            className='pointer-events-none absolute -right-10 -top-10 opacity-10'
          />

          <div className='relative z-10'>
            <p className='mb-3 text-xs font-bold tracking-widest'>
              TRAIN SMARTER
            </p>

            <h2 className='max-w-lg text-3xl font-bold tracking-tight sm:text-4xl'>
              Build your next workout.
            </h2>

            <p className='mt-3 max-w-md text-black/70'>
              Personalized training designed around your fitness goals,
              experience and equipment.
            </p>

            <button
              type='button'
              className='mt-6 inline-flex items-center gap-3 rounded-xl bg-black px-5 py-3 font-semibold text-[#A4FF00] disabled:opacity-70'
            >
              Generate Workout
              <ArrowRight size={18} />
            </button>

            <p className='mt-2 text-xs text-black/60'>
              Workout generator coming soon
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section className='mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6'
            >
              <stat.icon
                size={23}
                className='mb-5 text-[#A4FF00]'
              />

              <p className='text-2xl font-bold sm:text-3xl'>{stat.value}</p>

              <p className='mt-2 text-sm text-zinc-400'>{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Recent workouts */}
        <section>
          <h2 className='mb-5 text-2xl font-bold'>Recent Workouts</h2>

          {recentWorkouts.length === 0 ? (
            <div className='rounded-2xl border border-white/10 bg-[#111111] px-6 py-12 text-center'>
              <Dumbbell
                size={40}
                className='mx-auto mb-4 text-zinc-600'
              />

              <h3 className='text-lg font-semibold'>No workouts yet</h3>

              <p className='mx-auto mt-2 max-w-md text-sm text-zinc-400'>
                Complete your first workout to begin tracking your progress.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className='flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111111] p-5'
                >
                  <div className='rounded-xl bg-[#A4FF00]/10 p-3'>
                    <Dumbbell
                      size={23}
                      className='text-[#A4FF00]'
                    />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate font-semibold'>{workout.name}</h3>

                    <p className='mt-1 text-sm text-zinc-400'>
                      {workout.workout_type || "Workout"}
                      {" · "}
                      {Math.floor((workout.duration_seconds ?? 0) / 60)} min
                    </p>
                  </div>

                  <span className='text-xs font-medium text-[#A4FF00]'>
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
