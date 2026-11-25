"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dumbbell, Clock, Layers, Loader2, AlertCircle } from "lucide-react";

const supabase = createClient();

interface Workout {
  id: string;
  name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  is_completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exercise_order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_duration_seconds: number | null;
  target_distance_meters: number | null;
  rest_seconds: number | null;
  exercises: {
    id: string;
    name: string;
    muscle_group: string;
    equipment: string;
    tracking_type: string;
  };
  workout_sets: WorkoutSet[];
}

const cardClass = "rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6";

export default function WorkoutTrackerPage() {
  const params = useParams<{ id: string }>();
  const workoutId = params.id;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [measurementSystem, setMeasurementSystem] = useState("imperial");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingSetId, setSavingSetId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);
  const [isRestTimerPaused, setIsRestTimerPaused] = useState(false);

  const [setInputs, setSetInputs] = useState<
    Record<
      string,
      {
        weight: string;
        reps: string;
        duration: string;
        distance: string;
      }
    >
  >({});

  useEffect(() => {
    async function loadWorkout() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("User not authenticated.");

        const [workoutResult, exercisesResult, preferencesResult] =
          await Promise.all([
            supabase
              .from("workouts")
              .select("*")
              .eq("id", workoutId)
              .eq("user_id", user.id)
              .single(),

            supabase
              .from("workout_exercises")
              .select(
                `
              id,
              exercise_order,
              target_sets,
              target_reps,
              target_duration_seconds,
              target_distance_meters,
              rest_seconds,
              exercises (
                id,
                name,
                muscle_group,
                equipment,
                tracking_type
              ),
              workout_sets (
                id,
                set_number,
                reps,
                weight_kg,
                duration_seconds,
                distance_meters,
                is_completed
              )
            `,
              )
              .eq("workout_id", workoutId)
              .eq("user_id", user.id)
              .order("exercise_order", {
                ascending: true,
              }),

            supabase
              .from("user_preferences")
              .select("measurement_system")
              .eq("user_id", user.id)
              .single(),
          ]);

        if (workoutResult.error) {
          throw workoutResult.error;
        }

        if (exercisesResult.error) {
          throw exercisesResult.error;
        }

        if (preferencesResult.error) {
          throw preferencesResult.error;
        }

        const loadedExercises = (exercisesResult.data ??
          []) as unknown as WorkoutExercise[];

        setWorkout(workoutResult.data);

        setExercises(
          loadedExercises.map((item) => ({
            ...item,
            workout_sets: [...item.workout_sets].sort(
              (a, b) => a.set_number - b.set_number,
            ),
          })),
        );

        const system = preferencesResult.data.measurement_system ?? "imperial";

        setMeasurementSystem(system);

        const initialInputs: Record<
          string,
          {
            weight: string;
            reps: string;
            duration: string;
            distance: string;
          }
        > = {};

        loadedExercises.forEach((item) => {
          item.workout_sets.forEach((set) => {
            initialInputs[set.id] = {
              weight:
                set.weight_kg !== null
                  ? String(
                      system === "imperial"
                        ? Number((set.weight_kg * 2.20462262).toFixed(2))
                        : set.weight_kg,
                    )
                  : "",

              reps: String(set.reps ?? item.target_reps ?? ""),

              duration: String(
                set.duration_seconds ?? item.target_duration_seconds ?? "",
              ),

              distance:
                set.distance_meters !== null ||
                item.target_distance_meters !== null
                  ? String(
                      Number(
                        (
                          (set.distance_meters ??
                            item.target_distance_meters ??
                            0) / (system === "imperial" ? 1609.344 : 1000)
                        ).toFixed(3),
                      ),
                    )
                  : "",
            };
          });
        });

        setSetInputs(initialInputs);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Unable to load workout.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadWorkout();
  }, [workoutId]);
  useEffect(() => {
    if (!workout) return;

    if (workout.status === "completed") {
      setElapsedSeconds(workout.duration_seconds ?? 0);
      return;
    }

    if (workout.status !== "in_progress" || !workout.started_at) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = new Date(workout.started_at).getTime();

    function updateTimer() {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

      setElapsedSeconds(elapsed);
    }

    updateTimer();

    const interval = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(interval);
  }, [workout]);
  useEffect(() => {
    if (!isRestTimerActive || isRestTimerPaused) return;

    if (restSecondsRemaining <= 0) {
      setIsRestTimerActive(false);
      setIsRestTimerPaused(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setRestSecondsRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [isRestTimerActive, isRestTimerPaused, restSecondsRemaining]);
  const totalSets = exercises.reduce(
    (total, item) => total + item.workout_sets.length,
    0,
  );

  const completedSets = exercises.reduce(
    (total, item) =>
      total + item.workout_sets.filter((set) => set.is_completed).length,
    0,
  );

  const progress =
    totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  function updateSetInput(
    setId: string,
    field: "weight" | "reps" | "duration" | "distance",
    value: string,
  ) {
    setSetInputs((previous) => ({
      ...previous,
      [setId]: {
        ...previous[setId],
        [field]: value,
      },
    }));
  }
  async function handleCompleteSet(item: WorkoutExercise, set: WorkoutSet) {
    if (savingSetId || set.is_completed || workout?.status !== "in_progress") {
      return;
    }

    setError("");

    const inputs = setInputs[set.id];

    if (!inputs) return;

    const trackingType = item.exercises.tracking_type;

    function parseInput(value: string): number | null {
      if (value.trim() === "") return null;

      const number = Number(value);

      return Number.isFinite(number) && number >= 0 ? number : null;
    }

    const weight = parseInput(inputs.weight);
    const reps = parseInput(inputs.reps);
    const duration = parseInput(inputs.duration);
    const distance = parseInput(inputs.distance);

    // Validate required performance values.

    if (trackingType === "reps_weight") {
      if (weight === null) {
        setError("Enter a valid weight.");
        return;
      }
    }

    if (trackingType === "reps_weight" || trackingType === "reps") {
      if (reps === null || !Number.isInteger(reps) || reps <= 0) {
        setError("Enter a valid number of repetitions.");
        return;
      }
    }

    if (trackingType === "duration" || trackingType === "distance") {
      if (duration === null || !Number.isInteger(duration) || duration <= 0) {
        setError("Enter a valid duration in seconds.");
        return;
      }
    }

    if (trackingType === "distance") {
      if (distance === null || distance <= 0) {
        setError("Enter a valid distance.");
        return;
      }
    }

    // Convert measurements to database units.

    const weightKg =
      trackingType === "reps_weight" && weight !== null
        ? Number(
            (measurementSystem === "imperial"
              ? weight / 2.20462262
              : weight
            ).toFixed(4),
          )
        : null;

    const distanceMeters =
      trackingType === "distance" && distance !== null
        ? Number(
            (
              distance * (measurementSystem === "imperial" ? 1609.344 : 1000)
            ).toFixed(2),
          )
        : null;

    const updatedValues = {
      weight_kg: weightKg,

      reps:
        trackingType === "reps_weight" || trackingType === "reps" ? reps : null,

      duration_seconds:
        trackingType === "duration" || trackingType === "distance"
          ? duration
          : null,

      distance_meters: distanceMeters,

      is_completed: true,

      completed_at: new Date().toISOString(),
    };

    setSavingSetId(set.id);

    try {
      const { data, error: updateError } = await supabase
        .from("workout_sets")
        .update(updatedValues)
        .eq("id", set.id)
        .eq("workout_exercise_id", item.id)
        .eq("is_completed", false)
        .select()
        .single();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error("Unable to confirm set completion.");
      }
      // Start the rest countdown after successful set completion
      const restDuration = item.rest_seconds ?? 60;

      setRestTotalSeconds(restDuration);
      setRestSecondsRemaining(restDuration);
      setIsRestTimerPaused(false);
      setIsRestTimerActive(restDuration > 0);
      setExercises((previous) =>
        previous.map((exercise) =>
          exercise.id === item.id
            ? {
                ...exercise,
                workout_sets: exercise.workout_sets.map((existingSet) =>
                  existingSet.id === set.id
                    ? {
                        ...existingSet,
                        ...data,
                      }
                    : existingSet,
                ),
              }
            : exercise,
        ),
      );
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Unable to save completed set.";

      setError(message);
    } finally {
      setSavingSetId(null);
    }
  }
  function toggleRestTimerPause() {
    setIsRestTimerPaused((previous) => !previous);
  }

  function adjustRestTimer(seconds: number) {
    const nextRemaining = Math.max(0, restSecondsRemaining + seconds);

    setRestSecondsRemaining(nextRemaining);

    setRestTotalSeconds((previous) => Math.max(previous, nextRemaining));

    if (nextRemaining === 0) {
      setIsRestTimerActive(false);
      setIsRestTimerPaused(false);
    }
  }

  function skipRestTimer() {
    setRestSecondsRemaining(0);
    setRestTotalSeconds(0);
    setIsRestTimerActive(false);
    setIsRestTimerPaused(false);
  }
  function formatLabel(value: string) {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

  if (error || !workout) {
    return (
      <main className='mx-auto max-w-5xl px-4 py-10'>
        <div className='flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400'>
          <AlertCircle size={20} />
          {error || "Workout not found."}
        </div>
      </main>
    );
  }

  return (
    <main className='mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10'>
      {/* PAGE HEADER */}

      <div className='mb-8'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4FF00]'>
          Workout Tracker
        </p>

        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {workout.name}
        </h1>

        <p className='mt-2 text-sm text-zinc-400'>
          {formatLabel(workout.status)}
        </p>
      </div>

      {/* ELAPSED WORKOUT TIMER */}
      <div className='mb-6 rounded-2xl border border-white/10 bg-[#111111] p-5'>
        <div className='flex items-center gap-4'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
            <Clock
              size={24}
              className='text-[#A4FF00]'
            />
          </div>

          <div>
            <p className='text-xs font-medium uppercase tracking-wider text-zinc-400'>
              Elapsed Workout Time
            </p>

            <p className='mt-1 text-3xl font-bold tabular-nums text-[#A4FF00]'>
              {String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0")}:
              {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(
                2,
                "0",
              )}
              :{String(elapsedSeconds % 60).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* WORKOUT SUMMARY */}

      <section className={cardClass}>
        <div className='grid grid-cols-3 gap-3'>
          <div className='rounded-xl bg-[#1c1c1c] p-4'>
            <Dumbbell
              size={20}
              className='mb-3 text-[#A4FF00]'
            />

            <p className='text-2xl font-bold'>{exercises.length}</p>

            <p className='text-xs text-zinc-500'>Exercises</p>
          </div>

          <div className='rounded-xl bg-[#1c1c1c] p-4'>
            <Layers
              size={20}
              className='mb-3 text-[#A4FF00]'
            />

            <p className='text-2xl font-bold'>
              {completedSets}/{totalSets}
            </p>

            <p className='text-xs text-zinc-500'>Sets completed</p>
          </div>

          <div className='rounded-xl bg-[#1c1c1c] p-4'>
            <Clock
              size={20}
              className='mb-3 text-[#A4FF00]'
            />

            <p className='text-2xl font-bold'>{progress}%</p>

            <p className='text-xs text-zinc-500'>Progress</p>
          </div>
        </div>

        <div className='mt-6'>
          <div className='mb-2 flex justify-between text-xs'>
            <span className='text-zinc-400'>Workout progress</span>

            <span className='text-[#A4FF00]'>{progress}%</span>
          </div>

          <div className='h-2 overflow-hidden rounded-full bg-white/10'>
            <div
              className='h-full rounded-full bg-[#A4FF00] transition-all'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* EXERCISES */}

      <div className='mt-6 space-y-5'>
        {exercises.map((item, index) => (
          <section
            key={item.id}
            className={cardClass}
          >
            <div className='flex items-start gap-4'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A4FF00]/10 font-bold text-[#A4FF00]'>
                {String(index + 1).padStart(2, "0")}
              </div>

              <div>
                <h2 className='text-lg font-semibold'>{item.exercises.name}</h2>

                <p className='mt-1 text-xs text-zinc-500'>
                  {formatLabel(item.exercises.muscle_group)}
                  {" · "}
                  {formatLabel(item.exercises.equipment)}
                </p>
              </div>
            </div>

            {/* EXERCISE TARGETS */}

            <div className='mt-5 grid grid-cols-3 gap-2'>
              <div className='rounded-xl bg-[#1c1c1c] p-3 text-center'>
                <p className='font-bold text-[#A4FF00]'>
                  {item.target_sets ?? "—"}
                </p>

                <p className='text-xs text-zinc-500'>Target sets</p>
              </div>

              <div className='rounded-xl bg-[#1c1c1c] p-3 text-center'>
                <p className='font-bold text-[#A4FF00]'>
                  {item.target_duration_seconds !== null
                    ? `${item.target_duration_seconds}s`
                    : item.target_distance_meters !== null
                      ? `${item.target_distance_meters}m`
                      : (item.target_reps ?? "—")}
                </p>

                <p className='text-xs text-zinc-500'>
                  {item.target_duration_seconds !== null
                    ? "Duration"
                    : item.target_distance_meters !== null
                      ? "Distance"
                      : "Target reps"}
                </p>
              </div>

              <div className='rounded-xl bg-[#1c1c1c] p-3 text-center'>
                <p className='font-bold text-[#A4FF00]'>
                  {item.rest_seconds ?? 0}s
                </p>

                <p className='text-xs text-zinc-500'>Rest</p>
              </div>
            </div>

            {/* SAVED SETS */}

            {/* SAVED SETS */}

            <div className='mt-5 space-y-3'>
              {item.workout_sets.map((set) => {
                const trackingType = item.exercises.tracking_type;

                const inputs = setInputs[set.id] ?? {
                  weight: "",
                  reps: "",
                  duration: "",
                  distance: "",
                };

                const disabled =
                  set.is_completed ||
                  savingSetId !== null ||
                  workout.status !== "in_progress";

                const inputClass =
                  "w-full min-w-0 rounded-lg border border-white/10 bg-[#101010] px-3 py-3 text-sm text-white outline-none focus:border-[#A4FF00] disabled:opacity-50";

                return (
                  <div
                    key={set.id}
                    className={`rounded-xl border p-4 transition ${
                      set.is_completed
                        ? "border-[#A4FF00]/30 bg-[#A4FF00]/5"
                        : "border-white/10 bg-[#181818]"
                    }`}
                  >
                    {/* SET HEADER */}

                    <div className='mb-4 flex items-center justify-between'>
                      <span className='text-sm font-semibold'>
                        Set {set.set_number}
                      </span>

                      <span
                        className={`text-xs ${
                          set.is_completed ? "text-[#A4FF00]" : "text-zinc-500"
                        }`}
                      >
                        {set.is_completed ? "Completed" : "Pending"}
                      </span>
                    </div>

                    {/* PERFORMANCE INPUTS */}

                    <div className='grid grid-cols-2 gap-3'>
                      {trackingType === "reps_weight" && (
                        <div>
                          <label className='mb-2 block text-xs text-zinc-400'>
                            Weight (
                            {measurementSystem === "imperial" ? "lbs" : "kg"})
                          </label>

                          <input
                            type='number'
                            min='0'
                            step='any'
                            inputMode='decimal'
                            placeholder='0'
                            value={inputs.weight}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSetInput(set.id, "weight", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}

                      {(trackingType === "reps_weight" ||
                        trackingType === "reps") && (
                        <div>
                          <label className='mb-2 block text-xs text-zinc-400'>
                            Repetitions
                          </label>

                          <input
                            type='number'
                            min='1'
                            step='1'
                            inputMode='numeric'
                            value={inputs.reps}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSetInput(set.id, "reps", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}

                      {(trackingType === "duration" ||
                        trackingType === "distance") && (
                        <div>
                          <label className='mb-2 block text-xs text-zinc-400'>
                            Duration (seconds)
                          </label>

                          <input
                            type='number'
                            min='1'
                            step='1'
                            inputMode='numeric'
                            value={inputs.duration}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSetInput(set.id, "duration", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}

                      {trackingType === "distance" && (
                        <div>
                          <label className='mb-2 block text-xs text-zinc-400'>
                            Distance (
                            {measurementSystem === "imperial" ? "mi" : "km"})
                          </label>

                          <input
                            type='number'
                            min='0'
                            step='any'
                            inputMode='decimal'
                            value={inputs.distance}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSetInput(set.id, "distance", e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>
                      )}
                    </div>

                    {/* COMPLETE SET BUTTON */}

                    <button
                      type='button'
                      disabled={disabled}
                      onClick={() => handleCompleteSet(item, set)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                        set.is_completed
                          ? "bg-[#A4FF00]/10 text-[#A4FF00]"
                          : "bg-[#A4FF00] text-black hover:bg-[#b6ff40] disabled:opacity-50"
                      }`}
                    >
                      {savingSetId === set.id ? (
                        <>
                          <Loader2
                            size={18}
                            className='animate-spin'
                          />
                          Saving...
                        </>
                      ) : set.is_completed ? (
                        "✓ Set Completed"
                      ) : (
                        "Complete Set"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className='mt-6 text-center text-xs text-zinc-500'>
        Measurement system: {formatLabel(measurementSystem)}
      </p>
      {/* FLOATING REST TIMER */}
      {isRestTimerActive && (
        <div className='fixed inset-x-4 bottom-24 z-999 sm:inset-x-auto sm:right-6 sm:w-80 lg:bottom-6'>
          <div className='rounded-2xl border border-[#A4FF00]/30 bg-[#111111] p-5 shadow-2xl'>
            {/* HEADER */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock
                  size={20}
                  className='text-[#A4FF00]'
                />
                <h3 className='font-semibold text-white'>Rest Timer</h3>
              </div>

              <span className='text-xs text-zinc-400'>
                {isRestTimerPaused ? "Paused" : "Recover"}
              </span>
            </div>

            {/* COUNTDOWN */}
            <div className='my-5 text-center'>
              <p className='text-5xl font-bold tabular-nums text-[#A4FF00]'>
                {String(Math.floor(restSecondsRemaining / 60)).padStart(2, "0")}
                :{String(restSecondsRemaining % 60).padStart(2, "0")}
              </p>

              <p className='mt-2 text-xs uppercase tracking-widest text-zinc-500'>
                Rest Remaining
              </p>
            </div>

            {/* PROGRESS BAR */}
            <div className='mb-5 h-2 overflow-hidden rounded-full bg-white/10'>
              <div
                className='h-full rounded-full bg-[#A4FF00] transition-all duration-500'
                style={{
                  width: `${
                    restTotalSeconds > 0
                      ? (restSecondsRemaining / restTotalSeconds) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* TIMER CONTROLS */}
            <div className='grid grid-cols-3 gap-2'>
              <button
                type='button'
                onClick={() => adjustRestTimer(-15)}
                className='rounded-xl bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20'
              >
                -15 sec
              </button>

              <button
                type='button'
                onClick={toggleRestTimerPause}
                className='rounded-xl bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20'
              >
                {isRestTimerPaused ? "Resume" : "Pause"}
              </button>

              <button
                type='button'
                onClick={() => adjustRestTimer(15)}
                className='rounded-xl bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20'
              >
                +15 sec
              </button>
            </div>

            {/* SKIP REST */}
            <button
              type='button'
              onClick={skipRestTimer}
              className='mt-3 w-full rounded-xl bg-[#A4FF00] py-3 text-sm font-bold text-black hover:bg-[#b6ff40]'
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
