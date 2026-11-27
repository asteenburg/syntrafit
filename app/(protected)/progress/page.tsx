"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Dumbbell,
  Trophy,
  Clock,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const supabase = createClient();

// TYPES

interface ProgressSummary {
  completedWorkouts: number;
  personalRecords: number;
  totalTrainingSeconds: number;
  currentStreak: number;
}

interface ExerciseHistory {
  id: string;
  name: string;
  muscle_group: string;
  tracking_type: "reps_weight" | "reps" | "duration" | "distance";
}

interface PerformanceHistory {
  workout_id: string;
  workout_exercise_id: string;
  workout_set_id: string;
  workout_completed_at: string | null;
  set_completed_at: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
}
interface PersonalRecord {
  user_id: string;
  exercise_id: string;
  workout_id: string;
  workout_exercise_id: string;
  workout_set_id: string;
  record_type:
    | "max_weight"
    | "max_reps"
    | "max_volume"
    | "estimated_1rm"
    | "max_duration"
    | "max_distance"
    | "best_pace";
  record_value: number;
  unit: string;
  achieved_at: string;
  previous_best: number | null;
  is_first_record: boolean;
  improvement_percentage: number | null;
}

// HELPER FUNCTIONS

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return fallback;
}

function formatTrainingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function calculateWeeklyStreak(
  workouts: { completed_at: string | null }[],
): number {
  function getWeekStart(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  const completedWeeks = new Set<number>();

  for (const workout of workouts) {
    if (!workout.completed_at) continue;

    const date = new Date(workout.completed_at);

    if (Number.isNaN(date.getTime())) continue;

    completedWeeks.add(getWeekStart(date).getTime());
  }

  const currentWeek = getWeekStart(new Date());

  // Preserve the streak if the current week has not
  // yet been completed.

  if (!completedWeeks.has(currentWeek.getTime())) {
    currentWeek.setDate(currentWeek.getDate() - 7);
  }

  let streak = 0;

  while (completedWeeks.has(currentWeek.getTime())) {
    streak++;
    currentWeek.setDate(currentWeek.getDate() - 7);
  }

  return streak;
}

// PROGRESS PAGE

export default function ProgressPage() {
  // SUMMARY STATE

  const [summary, setSummary] = useState<ProgressSummary>({
    completedWorkouts: 0,
    personalRecords: 0,
    totalTrainingSeconds: 0,
    currentStreak: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // EXERCISE HISTORY STATE

  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // PERFORMANCE HISTORY STATE

  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceHistory[]
  >([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  const [performanceLoading, setPerformanceLoading] = useState(false);

  const [performanceError, setPerformanceError] = useState("");

  const [measurementSystem, setMeasurementSystem] = useState<
    "metric" | "imperial"
  >("imperial");

  // LOAD PROGRESS SUMMARY AND EXERCISE HISTORY

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
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

        if (cancelled) return;

        const [
          workoutResult,
          recordsResult,
          exerciseHistoryResult,
          preferencesResult,
        ] = await Promise.all([
          supabase
            .from("workouts")
            .select("id, completed_at, duration_seconds")
            .eq("user_id", user.id)
            .eq("status", "completed")
            .order("completed_at", { ascending: false }),

          supabase.rpc("get_historical_personal_records"),

          supabase.rpc("get_exercise_history_list"),

          supabase
            .from("user_preferences")
            .select("measurement_system")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (cancelled) return;

        if (workoutResult.error) {
          throw workoutResult.error;
        }

        if (recordsResult.error) {
          throw recordsResult.error;
        }

        if (exerciseHistoryResult.error) {
          throw exerciseHistoryResult.error;
        }

        const completedWorkouts = workoutResult.data ?? [];

        const historicalRecords = recordsResult.data ?? [];
        setPersonalRecords(historicalRecords);

        console.log("Historical personal records:", historicalRecords);

        const availableExercises: ExerciseHistory[] =
          exerciseHistoryResult.data ?? [];

        const totalTrainingSeconds = completedWorkouts.reduce(
          (total, workout) => total + (workout.duration_seconds ?? 0),
          0,
        );

        const progressSummary: ProgressSummary = {
          completedWorkouts: completedWorkouts.length,
          personalRecords: historicalRecords.length,
          totalTrainingSeconds,
          currentStreak: calculateWeeklyStreak(completedWorkouts),
        };

        setSummary(progressSummary);
        setExerciseHistory(availableExercises);

        if (preferencesResult.error) {
          console.error(
            "Unable to load measurement preference:",
            preferencesResult.error,
          );
        } else {
          const preferredSystem =
            preferencesResult.data?.measurement_system === "metric"
              ? "metric"
              : "imperial";

          setMeasurementSystem(preferredSystem);

          console.log("Measurement system:", preferredSystem);
        }

        const firstExerciseId = availableExercises[0]?.id ?? "";

        setPerformanceLoading(Boolean(firstExerciseId));
        setSelectedExerciseId(firstExerciseId);

        console.log("Progress summary:", progressSummary);
        console.log("Exercise history:", availableExercises);
      } catch (err) {
        if (!cancelled) {
          console.error("Unable to load progress:", err);

          setError(getErrorMessage(err, "Unable to load your progress."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);

          console.log("Progress loading finished");
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  // LOAD SELECTED EXERCISE PERFORMANCE

  useEffect(() => {
    if (!selectedExerciseId) {
      setPerformanceHistory([]);
      setPerformanceLoading(false);
      setPerformanceError("");

      return;
    }

    let cancelled = false;

    async function loadPerformanceHistory() {
      setPerformanceLoading(true);
      setPerformanceError("");
      setPerformanceHistory([]);

      try {
        const { data, error } = await supabase.rpc(
          "get_exercise_performance_history",
          {
            p_exercise_id: selectedExerciseId,
          },
        );

        if (error) throw error;

        if (!cancelled) {
          setPerformanceHistory(data ?? []);

          console.log("Performance history:", data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unable to load performance history:", err);

          setPerformanceError(
            getErrorMessage(err, "Unable to load performance history."),
          );
        }
      } finally {
        if (!cancelled) {
          setPerformanceLoading(false);
        }
      }
    }

    loadPerformanceHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedExerciseId]);

  // SELECTED EXERCISE

  const selectedExercise = exerciseHistory.find(
    (exercise) => exercise.id === selectedExerciseId,
  );

  // PERSONAL RECORD MATCHING

  function isPersonalRecord(
    setId: string,
    recordType: PersonalRecord["record_type"],
  ): boolean {
    return personalRecords.some(
      (record) =>
        record.workout_set_id === setId && record.record_type === recordType,
    );
  }

  // CHRONOLOGICAL SET HISTORY

  const chronologicalHistory = performanceHistory.map((set, index) => ({
    ...set,
    performanceNumber: index + 1,
  }));

  // DURATION CHART DATA

  const durationChartData = chronologicalHistory
    .filter((set) => set.duration_seconds !== null)
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      duration: set.duration_seconds,
      isPR: isPersonalRecord(set.workout_set_id, "max_duration"),
    }));

  // WEIGHT CHART DATA

  const weightUnit = measurementSystem === "imperial" ? "lbs" : "kg";

  const weightChartData = chronologicalHistory
    .filter((set) => set.weight_kg !== null)
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      weight: Number(
        (
          Number(set.weight_kg) *
          (measurementSystem === "imperial" ? 2.20462262 : 1)
        ).toFixed(2),
      ),
      isPR: isPersonalRecord(set.workout_set_id, "max_weight"),
    }));

  // REPETITION CHART DATA

  const repetitionChartData = chronologicalHistory
    .filter((set) => set.reps !== null)
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      reps: Number(set.reps),
      isPR: isPersonalRecord(set.workout_set_id, "max_reps"),
    }));

  // DISTANCE CHART DATA

  const distanceUnit = measurementSystem === "imperial" ? "mi" : "km";

  const distanceChartData = chronologicalHistory
    .filter((set) => set.distance_meters !== null)
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      distance: Number(
        (
          Number(set.distance_meters) /
          (measurementSystem === "imperial" ? 1609.344 : 1000)
        ).toFixed(3),
      ),
      isPR: isPersonalRecord(set.workout_set_id, "max_distance"),
    }));

  // PACE CHART DATA

  const paceUnit = measurementSystem === "imperial" ? "min/mi" : "min/km";

  const paceChartData = chronologicalHistory
    .filter(
      (set) =>
        set.distance_meters !== null &&
        set.distance_meters > 0 &&
        set.duration_seconds !== null &&
        set.duration_seconds > 0,
    )
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      pace:
        (Number(set.duration_seconds) / Number(set.distance_meters)) *
        (measurementSystem === "imperial" ? 1609.344 : 1000),
      isPR: isPersonalRecord(set.workout_set_id, "best_pace"),
    }));

  // VOLUME CHART DATA

  const volumeChartData = chronologicalHistory
    .filter(
      (set) =>
        set.weight_kg !== null &&
        set.weight_kg > 0 &&
        set.reps !== null &&
        set.reps > 0,
    )
    .map((set) => ({
      performance: set.performanceNumber,
      setId: set.workout_set_id,
      date: set.set_completed_at,
      volume: Number(
        (
          Number(set.weight_kg) *
          Number(set.reps) *
          (measurementSystem === "imperial" ? 2.20462262 : 1)
        ).toFixed(2),
      ),
      isPR: isPersonalRecord(set.workout_set_id, "max_volume"),
    }));

  // ESTIMATED 1RM CHART DATA

  const estimated1RMChartData = chronologicalHistory
    .filter(
      (set) =>
        set.weight_kg !== null &&
        set.weight_kg > 0 &&
        set.reps !== null &&
        set.reps >= 1 &&
        set.reps <= 10,
    )
    .map((set) => {
      const weight = Number(set.weight_kg);
      const reps = Number(set.reps);

      const estimated1RM = reps === 1 ? weight : weight * (1 + reps / 30);

      return {
        performance: set.performanceNumber,
        setId: set.workout_set_id,
        date: set.set_completed_at,
        estimated1RM: Number(
          (
            estimated1RM * (measurementSystem === "imperial" ? 2.20462262 : 1)
          ).toFixed(2),
        ),
        isPR: isPersonalRecord(set.workout_set_id, "estimated_1rm"),
      };
    });

  // EXERCISE CHANGE HANDLER

  function handleExerciseChange(exerciseId: string) {
    if (exerciseId === selectedExerciseId) return;

    setPerformanceHistory([]);
    setPerformanceError("");
    setPerformanceLoading(Boolean(exerciseId));
    setSelectedExerciseId(exerciseId);
  }

  // PAGE LOADING STATE

  if (loading) {
    return (
      <div
        role='status'
        aria-label='Loading progress'
        className='flex min-h-[70vh] items-center justify-center'
      >
        <Loader2
          size={32}
          className='animate-spin text-[#A4FF00]'
        />
      </div>
    );
  }

  // PAGE ERROR STATE

  if (error) {
    return (
      <main className='mx-auto max-w-6xl px-4 py-10'>
        <div
          role='alert'
          className='flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400'
        >
          <AlertCircle
            size={20}
            className='shrink-0'
          />

          {error}
        </div>
      </main>
    );
  }

  // PAGE CONTENT

  return (
    <main className='mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10'>
      {/* PAGE HEADER */}

      <div className='mb-8'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4FF00]'>
          Performance
        </p>

        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Your Progress
        </h1>

        <p className='mt-2 text-sm text-zinc-400'>
          Track your performance and celebrate your achievements.
        </p>
      </div>

      {/* TRAINING SUMMARY */}

      <div className='mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {/* COMPLETED WORKOUTS */}

        <div className='rounded-2xl border border-white/10 bg-[#111111] p-5'>
          <Dumbbell
            size={24}
            className='mb-4 text-[#A4FF00]'
          />

          <p className='text-2xl font-bold sm:text-3xl'>
            {summary.completedWorkouts}
          </p>

          <p className='mt-2 text-xs text-zinc-400 sm:text-sm'>
            Completed Workouts
          </p>
        </div>

        {/* PERSONAL RECORDS */}

        <div className='rounded-2xl border border-white/10 bg-[#111111] p-5'>
          <Trophy
            size={24}
            className='mb-4 text-[#FACC15]'
          />

          <p className='text-2xl font-bold sm:text-3xl'>
            {summary.personalRecords}
          </p>

          <p className='mt-2 text-xs text-zinc-400 sm:text-sm'>
            PR Achievements
          </p>
        </div>

        {/* TRAINING TIME */}

        <div className='rounded-2xl border border-white/10 bg-[#111111] p-5'>
          <Clock
            size={24}
            className='mb-4 text-[#A4FF00]'
          />

          <p className='text-2xl font-bold sm:text-3xl'>
            {formatTrainingTime(summary.totalTrainingSeconds)}
          </p>

          <p className='mt-2 text-xs text-zinc-400 sm:text-sm'>
            Total Training Time
          </p>
        </div>

        {/* WEEKLY STREAK */}

        <div className='rounded-2xl border border-white/10 bg-[#111111] p-5'>
          <Flame
            size={24}
            className='mb-4 text-[#A4FF00]'
          />

          <p className='text-2xl font-bold sm:text-3xl'>
            {summary.currentStreak}{" "}
            {summary.currentStreak === 1 ? "week" : "weeks"}
          </p>

          <p className='mt-2 text-xs text-zinc-400 sm:text-sm'>
            Current Streak
          </p>
        </div>
      </div>

      {/* EXERCISE PERFORMANCE */}

      <div className='mb-8 rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6'>
        <h2 className='text-xl font-bold'>Exercise Performance</h2>

        <p className='mt-1 text-sm text-zinc-400'>
          Track your performance over time.
        </p>

        {/* EXERCISE SELECTOR */}

        <div className='mt-5'>
          <label
            htmlFor='exercise-selector'
            className='mb-2 block text-sm font-medium text-zinc-400'
          >
            Select Exercise
          </label>

          <select
            id='exercise-selector'
            value={selectedExerciseId}
            onChange={(e) => handleExerciseChange(e.target.value)}
            disabled={exerciseHistory.length === 0}
            className='w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none focus:border-[#A4FF00] disabled:opacity-50'
          >
            {exerciseHistory.length === 0 && (
              <option value=''>No exercise history available</option>
            )}

            {exerciseHistory.map((exercise) => (
              <option
                key={exercise.id}
                value={exercise.id}
              >
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        {/* PERFORMANCE LOADING STATE */}

        {performanceLoading && (
          <div
            role='status'
            aria-label='Loading exercise performance'
            className='flex items-center justify-center py-8'
          >
            <Loader2
              size={24}
              className='animate-spin text-[#A4FF00]'
            />
          </div>
        )}

        {/* PERFORMANCE ERROR STATE */}

        {!performanceLoading && performanceError && (
          <div
            role='alert'
            className='mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400'
          >
            <AlertCircle
              size={20}
              className='shrink-0'
            />

            {performanceError}
          </div>
        )}

        {/* PERFORMANCE HISTORY COUNT */}

        {selectedExercise && !performanceLoading && !performanceError && (
          <p className='mt-3 text-sm text-zinc-400'>
            {performanceHistory.length} recorded{" "}
            {performanceHistory.length === 1 ? "set" : "sets"}
          </p>
        )}

        {/* PERFORMANCE CHART LEGEND */}

        {selectedExercise &&
          !performanceLoading &&
          !performanceError &&
          performanceHistory.length > 0 && (
            <div className='mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-white/10 bg-[#080808] px-4 py-3'>
              <div className='flex items-center gap-2'>
                <span className='h-3 w-3 rounded-full bg-[#FACC15]' />

                <span className='text-xs text-zinc-400'>Personal Record</span>
              </div>

              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-[#A4FF00]' />

                <span className='text-xs text-zinc-400'>
                  Regular Performance
                </span>
              </div>
            </div>
          )}

        {/* DURATION PERFORMANCE CHART */}

        {(selectedExercise?.tracking_type === "duration" ||
          selectedExercise?.tracking_type === "distance") &&
          !performanceLoading &&
          !performanceError &&
          durationChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Duration Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={durationChartData}
                    margin={{
                      top: 10,
                      right: 15,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: number) => {
                        const minutes = Math.floor(value / 60);
                        const seconds = Math.floor(value % 60);

                        return `${minutes}:${String(seconds).padStart(2, "0")}`;
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value, _name, item) => {
                        const totalSeconds = Number(value);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = Math.floor(totalSeconds % 60);

                        const isPR = item?.payload?.isPR === true;

                        return [
                          `${minutes}m ${seconds}s`,
                          isPR ? "Duration — New PR 🏆" : "Duration",
                        ];
                      }}
                    />

                    <Line
                      type='linear'
                      dataKey='duration'
                      name='Duration (seconds)'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* WEIGHT PERFORMANCE CHART */}

        {selectedExercise?.tracking_type === "reps_weight" &&
          !performanceLoading &&
          !performanceError &&
          weightChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Weight Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={weightChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      unit={` ${weightUnit}`}
                      width={65}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value, _name, item) => {
                        const isPR = item?.payload?.isPR === true;

                        return [
                          `${value} ${weightUnit}`,
                          isPR ? "Weight — New PR 🏆" : "Weight",
                        ];
                      }}
                    />

                    <Line
                      type='linear'
                      dataKey='weight'
                      name='Weight'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* REPETITION PERFORMANCE CHART */}

        {(selectedExercise?.tracking_type === "reps_weight" ||
          selectedExercise?.tracking_type === "reps") &&
          !performanceLoading &&
          !performanceError &&
          repetitionChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Repetition Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={repetitionChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      unit=' reps'
                      width={65}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value) => [`${value} reps`, "Repetitions"]}
                    />

                    <Line
                      type='linear'
                      dataKey='reps'
                      name='Repetitions'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* DISTANCE PERFORMANCE CHART */}

        {selectedExercise?.tracking_type === "distance" &&
          !performanceLoading &&
          !performanceError &&
          distanceChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Distance Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={distanceChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      unit={` ${distanceUnit}`}
                      width={65}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value) => [
                        `${value} ${distanceUnit}`,
                        "Distance",
                      ]}
                    />

                    <Line
                      type='linear'
                      dataKey='distance'
                      name='Distance'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* PACE PERFORMANCE CHART */}

        {selectedExercise?.tracking_type === "distance" &&
          !performanceLoading &&
          !performanceError &&
          paceChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Pace Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={paceChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      width={85}
                      reversed
                      tickFormatter={(value: number) => {
                        const totalSeconds = Math.round(value);
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;

                        return `${minutes}:${String(seconds).padStart(2, "0")} ${paceUnit}`;
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value) => {
                        const totalSeconds = Math.round(Number(value));
                        const minutes = Math.floor(totalSeconds / 60);
                        const seconds = totalSeconds % 60;

                        return [
                          `${minutes}:${String(seconds).padStart(2, "0")} ${paceUnit}`,
                          "Average Pace",
                        ];
                      }}
                    />

                    <Line
                      type='linear'
                      dataKey='pace'
                      name='Average Pace'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className='mt-2 text-xs text-zinc-500'>
                A lower pace indicates faster performance.
              </p>
            </div>
          )}

        {/* VOLUME PERFORMANCE CHART */}

        {selectedExercise?.tracking_type === "reps_weight" &&
          !performanceLoading &&
          !performanceError &&
          volumeChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Training Volume Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={volumeChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      unit={` ${weightUnit}`}
                      width={80}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value) => [
                        `${value} ${weightUnit}`,
                        "Set Volume",
                      ]}
                    />

                    <Line
                      type='linear'
                      dataKey='volume'
                      name='Set Volume'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className='mt-2 text-xs text-zinc-500'>
                Set volume is calculated by multiplying weight by repetitions.
              </p>
            </div>
          )}

        {/* ESTIMATED 1RM PERFORMANCE CHART */}

        {selectedExercise?.tracking_type === "reps_weight" &&
          !performanceLoading &&
          !performanceError &&
          estimated1RMChartData.length > 0 && (
            <div className='mt-6'>
              <h3 className='mb-4 text-sm font-semibold text-zinc-300'>
                Estimated 1RM Progress
              </h3>

              <div className='h-[280px] w-full min-w-0'>
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  <LineChart
                    data={estimated1RMChartData}
                    margin={{ top: 10, right: 15, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid
                      stroke='#292929'
                      strokeDasharray='3 3'
                      vertical={false}
                    />

                    <XAxis
                      dataKey='performance'
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      stroke='#71717A'
                      tick={{ fontSize: 12 }}
                      unit={` ${weightUnit}`}
                      width={65}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#181818",
                        border: "1px solid #333333",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                      }}
                      labelFormatter={(value, payload) => {
                        const date = payload?.[0]?.payload?.date;

                        if (!date) return `Set ${value}`;

                        const formattedDate = new Date(date).toLocaleString(
                          "en-CA",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        );

                        return `Set ${value} — ${formattedDate}`;
                      }}
                      formatter={(value) => [
                        `${value} ${weightUnit}`,
                        "Estimated 1RM",
                      ]}
                    />

                    <Line
                      type='linear'
                      dataKey='estimated1RM'
                      name='Estimated 1RM'
                      stroke='#A4FF00'
                      strokeWidth={3}
                      dot={({ cx, cy, payload }) => {
                        const isPR = payload?.isPR === true;

                        return (
                          <circle
                            key={payload?.setId}
                            cx={cx}
                            cy={cy}
                            r={isPR ? 6 : 4}
                            fill={isPR ? "#FACC15" : "#A4FF00"}
                            stroke={isPR ? "#FACC15" : "none"}
                            strokeWidth={isPR ? 1 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className='mt-2 text-xs text-zinc-500'>
                Estimated maximum lifting strength based on sets of 1–10
                repetitions.
              </p>
            </div>
          )}

        {/* NO EXERCISE HISTORY */}

        {exerciseHistory.length === 0 && (
          <div className='mt-5 rounded-xl border border-white/10 bg-[#080808] p-5 text-center'>
            <Dumbbell
              size={28}
              className='mx-auto mb-3 text-zinc-500'
            />

            <p className='text-sm font-medium text-zinc-300'>
              No exercise history yet
            </p>

            <p className='mt-1 text-xs text-zinc-500'>
              Complete a workout to start tracking your performance.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
