"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  Bookmark,
  CheckCircle2,
  Dumbbell,
  Clock,
  Layers,
  Loader2,
  AlertCircle,
  ArrowRight,
  Zap,
  Trophy,
} from "lucide-react";

const supabase = createClient();

interface Workout {
  id: string;
  name: string;
  status: string;
  source: string;
  workout_type: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  workout_exercises: {
    id: string;
    workout_sets: {
      id: string;
      is_completed: boolean;
    }[];
  }[];
}

const cardClass = "rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workoutPRCounts, setWorkoutPRCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    async function loadWorkouts() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          throw new Error("User not authenticated.");
        }

        const { data, error: workoutError } = await supabase
          .from("workouts")
          .select(
            `
            id,
            name,
            status,
            source,
            workout_type,
            started_at,
            completed_at,
            duration_seconds,
            created_at,
            workout_exercises (
              id,
              workout_sets (
                id,
                is_completed
              )
            )
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (workoutError) throw workoutError;

        setWorkouts((data ?? []) as Workout[]);
        // Retrieve historical personal record achievements.
        const { data: historicalRecords, error: recordsError } =
          await supabase.rpc("get_historical_personal_records");

        if (recordsError) {
          console.error("Unable to load historical PRs:", recordsError);
          setWorkoutPRCounts({});
        } else {
          const prCounts: Record<string, number> = {};

          for (const record of historicalRecords ?? []) {
            prCounts[record.workout_id] =
              (prCounts[record.workout_id] ?? 0) + 1;
          }

          setWorkoutPRCounts(prCounts);

          console.log("PR counts by workout:", prCounts);
        }
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Unable to load workouts.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkouts();
  }, []);

  const activeWorkouts = workouts.filter(
    (workout) => workout.status === "in_progress",
  );

  const savedWorkouts = workouts.filter(
    (workout) => workout.status === "planned",
  );
  const cancelledWorkouts = workouts.filter(
    (workout) => workout.status === "cancelled",
  );

  const completedWorkouts = workouts
    .filter((workout) => workout.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime(),
    );
  const groupedCompletedWorkouts = completedWorkouts.reduce<
    Record<string, Workout[]>
  >((groups, workout) => {
    const date = workout.completed_at
      ? new Date(workout.completed_at).toLocaleDateString("en-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Completion date unavailable";

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(workout);

    return groups;
  }, {});

  function getWorkoutStats(workout: Workout) {
    const exerciseCount = workout.workout_exercises.length;

    const totalSets = workout.workout_exercises.reduce(
      (total, exercise) => total + exercise.workout_sets.length,
      0,
    );

    const completedSets = workout.workout_exercises.reduce(
      (total, exercise) =>
        total + exercise.workout_sets.filter((set) => set.is_completed).length,
      0,
    );

    const progress =
      totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    return {
      exerciseCount,
      totalSets,
      completedSets,
      progress,
    };
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    const formattedDate = date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} at ${formattedTime.toUpperCase()}`;
  }

  function getWorkoutTimestamp(workout: Workout) {
    switch (workout.status) {
      case "completed":
        return workout.completed_at
          ? `Completed ${formatDate(workout.completed_at)}`
          : "Completion time unavailable";

      case "in_progress":
        return workout.started_at
          ? `Started ${formatDate(workout.started_at)}`
          : "Start time unavailable";

      case "planned":
        return `Saved ${formatDate(workout.created_at)}`;

      case "cancelled":
        return `Created ${formatDate(workout.created_at)}`;

      default:
        return formatDate(workout.created_at);
    }
  }

  function formatDuration(seconds: number | null) {
    if (seconds === null) return "—";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  }

  function formatLabel(value: string) {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderWorkoutCard(workout: Workout) {
    const stats = getWorkoutStats(workout);

    const isActive = workout.status === "in_progress";
    const isCompleted = workout.status === "completed";
    const prCount = workoutPRCounts[workout.id] ?? 0;

    return (
      <article
        key={workout.id}
        className={`${cardClass} ${isActive ? "border-[#A4FF00]/25" : ""}`}
      >
        {/* WORKOUT HEADER */}

        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
              <Dumbbell
                size={22}
                className='text-[#A4FF00]'
              />
            </div>

            <div className='min-w-0'>
              <h3 className='font-semibold text-white'>{workout.name}</h3>

              <p className='mt-1 text-xs text-zinc-500'>
                {formatLabel(workout.source)}
              </p>

              <p className='mt-1 text-xs text-zinc-400'>
                {getWorkoutTimestamp(workout)}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              isActive || isCompleted
                ? "bg-[#A4FF00]/10 text-[#A4FF00]"
                : "bg-white/10 text-zinc-400"
            }`}
          >
            {formatLabel(workout.status)}
          </span>
        </div>

        {/* PERSONAL RECORD ACHIEVEMENTS */}

        {isCompleted && prCount > 0 && (
          <div className='mt-4'>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-[#FACC15]/25 bg-[#FACC15]/10 px-3 py-1.5 text-xs font-semibold text-[#FACC15]'>
              <Trophy size={14} />
              {prCount === 1 ? "New PR" : `${prCount} New PRs`}
            </span>
          </div>
        )}

        {/* WORKOUT STATISTICS */}

        <div className='mt-5 grid grid-cols-3 gap-2'>
          <div className='rounded-xl bg-[#1c1c1c] p-3'>
            <Dumbbell
              size={16}
              className='mb-2 text-zinc-500'
            />

            <p className='font-bold'>{stats.exerciseCount}</p>

            <p className='text-xs text-zinc-500'>Exercises</p>
          </div>

          <div className='rounded-xl bg-[#1c1c1c] p-3'>
            <Layers
              size={16}
              className='mb-2 text-zinc-500'
            />

            <p className='font-bold'>
              {stats.completedSets}/{stats.totalSets}
            </p>

            <p className='text-xs text-zinc-500'>Sets</p>
          </div>

          <div className='rounded-xl bg-[#1c1c1c] p-3'>
            <Clock
              size={16}
              className='mb-2 text-zinc-500'
            />

            <p className='font-bold'>
              {formatDuration(workout.duration_seconds)}
            </p>

            <p className='text-xs text-zinc-500'>Duration</p>
          </div>
        </div>

        {/* WORKOUT PROGRESS */}

        {(isActive || isCompleted) && (
          <div className='mt-5'>
            <div className='mb-2 flex justify-between text-xs'>
              <span className='text-zinc-400'>Sets completed</span>

              <span className='font-semibold text-[#A4FF00]'>
                {stats.progress}%
              </span>
            </div>

            <div className='h-2 overflow-hidden rounded-full bg-white/10'>
              <div
                className='h-full rounded-full bg-[#A4FF00]'
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* WORKOUT ACTION */}

        <Link
          href={`/workouts/${workout.id}`}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            isActive
              ? "bg-[#A4FF00] text-black hover:bg-[#b6ff40]"
              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          {isActive ? "Resume Workout" : "View Workout"}

          <ArrowRight size={16} />
        </Link>
      </article>
    );
  }

  if (loading) {
    return (
      <div className='flex min-h-[70vh] items-center justify-center'>
        <Loader2
          size={32}
          className='animate-spin text-[#A4FF00]'
        />
      </div>
    );
  }

  if (error) {
    return (
      <main className='mx-auto max-w-6xl px-4 py-10'>
        <div className='flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400'>
          <AlertCircle size={20} />
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className='mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10'>
      {/* PAGE HEADER */}

      <div className='mb-8 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4FF00]'>
            Training
          </p>

          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
            My Workouts
          </h1>

          <p className='mt-2 text-sm text-zinc-400'>
            Manage your training and review your performance.
          </p>
        </div>

        <Link
          href='/generator'
          className='flex items-center gap-2 rounded-xl bg-[#A4FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#b6ff40]'
        >
          <Zap size={18} />
          Generate Workout
        </Link>
      </div>

      {/* SUMMARY STATISTICS */}

      <div className='mb-10 grid grid-cols-3 gap-3'>
        <div className={cardClass}>
          <Activity
            size={22}
            className='mb-3 text-[#A4FF00]'
          />

          <p className='text-3xl font-bold'>{activeWorkouts.length}</p>

          <p className='mt-1 text-xs text-zinc-500'>Active</p>
        </div>

        <div className={cardClass}>
          <Bookmark
            size={22}
            className='mb-3 text-[#A4FF00]'
          />

          <p className='text-3xl font-bold'>{savedWorkouts.length}</p>

          <p className='mt-1 text-xs text-zinc-500'>Saved</p>
        </div>

        <div className={cardClass}>
          <CheckCircle2
            size={22}
            className='mb-3 text-[#A4FF00]'
          />

          <p className='text-3xl font-bold'>{completedWorkouts.length}</p>

          <p className='mt-1 text-xs text-zinc-500'>Completed</p>
        </div>
      </div>

      {/* ACTIVE WORKOUTS */}

      <section className='mb-10'>
        <div className='mb-4 flex items-center gap-2'>
          <Activity
            size={20}
            className='text-[#A4FF00]'
          />

          <h2 className='text-xl font-bold'>Active Workouts</h2>
        </div>

        {activeWorkouts.length > 0 ? (
          <div className='grid gap-4 xl:grid-cols-2'>
            {activeWorkouts.map(renderWorkoutCard)}
          </div>
        ) : (
          <div className={cardClass}>
            <p className='text-sm text-zinc-400'>
              You have no active workouts.
            </p>
          </div>
        )}
      </section>

      {/* SAVED WORKOUTS */}

      <section className='mb-10'>
        <div className='mb-4 flex items-center gap-2'>
          <Bookmark
            size={20}
            className='text-[#A4FF00]'
          />

          <h2 className='text-xl font-bold'>Saved Workouts</h2>
        </div>

        {savedWorkouts.length > 0 ? (
          <div className='grid gap-4 xl:grid-cols-2'>
            {savedWorkouts.map(renderWorkoutCard)}
          </div>
        ) : (
          <div className={cardClass}>
            <p className='text-sm text-zinc-400'>You have no saved workouts.</p>
          </div>
        )}
      </section>

      {/* COMPLETED WORKOUT HISTORY */}

      <section>
        <div className='mb-4 flex items-center gap-2'>
          <CheckCircle2
            size={20}
            className='text-[#A4FF00]'
          />

          <h2 className='text-xl font-bold'>Workout History</h2>
        </div>

        {completedWorkouts.length > 0 ? (
          <div className='space-y-8'>
            {Object.entries(groupedCompletedWorkouts).map(
              ([date, dailyWorkouts]) => (
                <div key={date}>
                  <div className='mb-4 flex items-center gap-3'>
                    <h3 className='text-sm font-semibold text-zinc-400'>
                      {date}
                    </h3>

                    <div className='h-px flex-1 bg-white/10' />

                    <span className='text-xs text-zinc-500'>
                      {dailyWorkouts.length}{" "}
                      {dailyWorkouts.length === 1 ? "workout" : "workouts"}
                    </span>
                  </div>

                  <div className='grid gap-4 xl:grid-cols-2'>
                    {dailyWorkouts.map(renderWorkoutCard)}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className={cardClass}>
            <p className='text-sm text-zinc-400'>
              Your completed workouts will appear here.
            </p>
          </div>
        )}
      </section>
      {/* CANCELLED WORKOUTS */}
      <section className='mt-10'>
        <div className='mb-4 flex items-center gap-3'>
          <AlertCircle
            size={22}
            className='text-red-400'
          />

          <h2 className='text-xl font-semibold'>Cancelled Workouts</h2>

          <span className='rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400'>
            {cancelledWorkouts.length}
          </span>
        </div>

        {cancelledWorkouts.length > 0 ? (
          <div className='grid gap-4 xl:grid-cols-2'>
            {cancelledWorkouts.map(renderWorkoutCard)}
          </div>
        ) : (
          <div className={cardClass}>
            <p className='text-sm text-zinc-400'>
              You have no cancelled workouts.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
