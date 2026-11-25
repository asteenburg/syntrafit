"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  generateWorkout,
  type Exercise,
  type FitnessGoal,
  type ExperienceLevel,
  type TrainingFocus,
  type GeneratedWorkout,
} from "@/lib/workout-generator";

import {
  Zap,
  Dumbbell,
  Target,
  Clock,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Layers,
  Timer,
  PersonStanding,
  Footprints,
  ArrowUp,
  ArrowDown,
  HeartPulse,
  Flame,
  SlidersHorizontal,
} from "lucide-react";

const supabase = createClient();

const GOALS: { value: FitnessGoal; label: string }[] = [
  { value: "build_muscle", label: "Build Muscle" },
  { value: "increase_strength", label: "Increase Strength" },
  { value: "lose_weight", label: "Lose Weight" },
  { value: "improve_endurance", label: "Improve Endurance" },
  { value: "general_fitness", label: "General Fitness" },
];

const FOCUS_OPTIONS = [
  { value: "full_body", label: "Full Body", icon: PersonStanding },
  { value: "upper_body", label: "Upper Body", icon: Dumbbell },
  { value: "lower_body", label: "Lower Body", icon: Footprints },
  { value: "push", label: "Push", icon: ArrowUp },
  { value: "pull", label: "Pull", icon: ArrowDown },
  { value: "core", label: "Core", icon: Target },
  { value: "cardio", label: "Cardio", icon: HeartPulse },
  { value: "conditioning", label: "Conditioning", icon: Flame },
  { value: "custom", label: "Custom", icon: SlidersHorizontal },
] as const;

const EQUIPMENT = [
  "Bodyweight",
  "Dumbbells",
  "Barbells",
  "Kettlebells",
  "Cable Machines",
  "Gym Machines",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Treadmill",
  "Rowing Machine",
  "Stationary Bike",
  "Squat Rack",
  "Dip Station",
];

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
];

const DURATIONS = [15, 20, 30, 45, 60, 75, 90];

const cardClass = "rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1c1c1c] px-4 py-3 text-sm text-white outline-none focus:border-[#A4FF00]";

export default function GeneratorPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const [goal, setGoal] = useState<FitnessGoal>("general_fitness");

  const [experience, setExperience] = useState<ExperienceLevel>("beginner");

  const [duration, setDuration] = useState(45);

  const [focus, setFocus] = useState<TrainingFocus>("full_body");

  const [equipment, setEquipment] = useState<string[]>([]);

  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);

  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGenerator() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("User not authenticated.");

        const [preferencesResult, exercisesResult] = await Promise.all([
          supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single(),

          supabase
            .from("exercises")
            .select(
              "id,name,muscle_group,secondary_muscles,equipment,difficulty,category,tracking_type",
            )
            .eq("is_active", true),
        ]);

        if (preferencesResult.error) {
          throw preferencesResult.error;
        }

        if (exercisesResult.error) {
          throw exercisesResult.error;
        }

        const preferences = preferencesResult.data;

        if (GOALS.some((item) => item.value === preferences.fitness_goal)) {
          setGoal(preferences.fitness_goal as FitnessGoal);
        }

        if (
          ["beginner", "intermediate", "advanced"].includes(
            preferences.experience_level,
          )
        ) {
          setExperience(preferences.experience_level as ExperienceLevel);
        }

        setDuration(
          DURATIONS.includes(preferences.preferred_duration)
            ? preferences.preferred_duration
            : 45,
        );

        setEquipment(preferences.available_equipment ?? []);

        setMuscleGroups(preferences.preferred_muscle_groups ?? []);

        setExercises((exercisesResult.data ?? []) as Exercise[]);

        setProfileLoaded(true);
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Unable to load the workout generator.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadGenerator();
  }, []);

  function toggleEquipment(item: string) {
    setEquipment((previous) =>
      previous.includes(item)
        ? previous.filter((value) => value !== item)
        : [...previous, item],
    );
  }

  function toggleMuscleGroup(item: string) {
    setMuscleGroups((previous) =>
      previous.includes(item)
        ? previous.filter((value) => value !== item)
        : [...previous, item],
    );
  }

  function handleGenerate() {
    if (saving) return;

    setError("");

    if (exercises.length === 0) {
      setError("No exercises are available.");
      return;
    }

    if (focus === "custom" && muscleGroups.length === 0) {
      setError("Select at least one muscle group.");
      return;
    }

    const result = generateWorkout(exercises, {
      goal,
      experience,
      duration,
      focus,
      equipment,
      muscleGroups,
    });

    setSavedWorkoutId(null);
    setWorkout(result);
  }

  async function handleSaveWorkout(startNow: boolean) {
    if (
      !workout ||
      workout.exercises.length === 0 ||
      saving ||
      savedWorkoutId
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data, error: saveError } = await supabase.rpc(
        "create_generated_workout",
        {
          p_name: workout.name,
          p_workout_type: workout.focus,
          p_start_now: startNow,
          p_exercises: workout.exercises.map((item) => ({
            exercise_id: item.exercise.id,
            target_sets: item.sets,
            target_reps: item.reps,
            rest_seconds: item.restSeconds,
            target_duration_seconds: item.durationSeconds,
            target_distance_meters: item.distanceMeters,
          })),
        },
      );

      if (saveError) throw saveError;

      if (!data) {
        throw new Error("No workout ID was returned.");
      }

      setSavedWorkoutId(data);

      if (startNow) {
        router.push(`/workouts/${data}`);
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Unable to save workout.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function formatMuscleGroup(value: string) {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatTime(seconds: number) {
    if (seconds < 60) return `${seconds} sec`;

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return remainder ? `${minutes}m ${remainder}s` : `${minutes} min`;
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

  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10'>
      {/* PAGE HEADER */}

      <div className='mb-8'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4FF00]'>
          Intelligent Training
        </p>

        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Generate Workout
        </h1>

        <p className='mt-2 text-sm text-zinc-400'>
          Personalized training. Built around you.
        </p>
      </div>

      {error && (
        <div className='mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400'>
          <AlertCircle
            size={20}
            className='shrink-0'
          />
          {error}
        </div>
      )}

      {profileLoaded && (
        <div className='mb-6 flex items-start gap-3 rounded-xl border border-[#A4FF00]/20 bg-[#A4FF00]/5 p-4'>
          <Sparkles
            size={20}
            className='mt-0.5 shrink-0 text-[#A4FF00]'
          />

          <div>
            <p className='text-sm font-semibold text-[#A4FF00]'>
              Personalized for you
            </p>

            <p className='mt-1 text-xs leading-relaxed text-zinc-400'>
              Your saved fitness preferences have been loaded. Changes made here
              apply only to this workout.
            </p>
          </div>
        </div>
      )}

      <div className='grid items-start gap-6 xl:grid-cols-2'>
        {/* GENERATOR SETTINGS */}

        <div className='space-y-6'>
          {/* GOAL AND EXPERIENCE */}

          <section className={cardClass}>
            <div className='mb-5 flex items-center gap-3'>
              <Target
                size={22}
                className='text-[#A4FF00]'
              />
              <h2 className='font-semibold'>Training Settings</h2>
            </div>

            <div className='space-y-5'>
              <div>
                <label className='mb-2 block text-sm text-zinc-400'>
                  Fitness Goal
                </label>

                <select
                  className={inputClass}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as FitnessGoal)}
                >
                  {GOALS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-2 block text-sm text-zinc-400'>
                  Experience Level
                </label>

                <div className='grid grid-cols-3 gap-2'>
                  {(["beginner", "intermediate", "advanced"] as const).map(
                    (level) => (
                      <button
                        key={level}
                        type='button'
                        aria-pressed={experience === level}
                        onClick={() => setExperience(level)}
                        className={`rounded-xl border px-2 py-3 text-xs font-semibold capitalize transition sm:text-sm ${
                          experience === level
                            ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                            : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                        }`}
                      >
                        {level}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* WORKOUT DURATION */}

          <section className={cardClass}>
            <div className='mb-5 flex items-center gap-3'>
              <Clock
                size={22}
                className='text-[#A4FF00]'
              />
              <h2 className='font-semibold'>Workout Duration</h2>
            </div>

            <div className='grid grid-cols-4 gap-2'>
              {DURATIONS.map((minutes) => (
                <button
                  key={minutes}
                  type='button'
                  aria-pressed={duration === minutes}
                  onClick={() => setDuration(minutes)}
                  className={`rounded-xl border py-3 transition ${
                    duration === minutes
                      ? "border-[#A4FF00] bg-[#A4FF00] text-black"
                      : "border-white/10 bg-[#1c1c1c] text-white"
                  }`}
                >
                  <p className='text-xl font-bold'>{minutes}</p>

                  <p className='text-xs opacity-60'>min</p>
                </button>
              ))}
            </div>
          </section>

          {/* TRAINING FOCUS */}

          <section className={cardClass}>
            <div className='mb-5 flex items-center gap-3'>
              <Dumbbell
                size={22}
                className='text-[#A4FF00]'
              />
              <h2 className='font-semibold'>Training Focus</h2>
            </div>

            <div className='grid grid-cols-3 gap-2'>
              {FOCUS_OPTIONS.map((item) => {
                const Icon = item.icon;
                const selected = focus === item.value;

                return (
                  <button
                    key={item.value}
                    type='button'
                    aria-pressed={selected}
                    onClick={() => setFocus(item.value)}
                    className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border p-3 transition ${
                      selected
                        ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                        : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                    }`}
                  >
                    <Icon size={23} />

                    <span className='text-center text-xs font-medium'>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {focus === "custom" && (
              <div className='mt-5 border-t border-white/10 pt-5'>
                <p className='mb-3 text-sm text-zinc-400'>
                  Select target muscle groups
                </p>

                <div className='flex flex-wrap gap-2'>
                  {MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type='button'
                      aria-pressed={muscleGroups.includes(group)}
                      onClick={() => toggleMuscleGroup(group)}
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        muscleGroups.includes(group)
                          ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                          : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* AVAILABLE EQUIPMENT */}

          <section className={cardClass}>
            <div className='mb-2 flex items-center gap-3'>
              <Layers
                size={22}
                className='text-[#A4FF00]'
              />
              <h2 className='font-semibold'>Available Equipment</h2>
            </div>

            <p className='mb-5 text-xs text-zinc-500'>
              Select the equipment available for this workout. Bodyweight
              exercises are always eligible.
            </p>

            <div className='grid grid-cols-2 gap-2'>
              {EQUIPMENT.map((item) => {
                const selected = equipment.includes(item);

                return (
                  <button
                    key={item}
                    type='button'
                    aria-pressed={selected}
                    onClick={() => toggleEquipment(item)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition sm:text-sm ${
                      selected
                        ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                        : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[#A4FF00] bg-[#A4FF00] text-black"
                          : "border-zinc-600"
                      }`}
                    >
                      {selected ? "✓" : ""}
                    </span>

                    {item}
                  </button>
                );
              })}
            </div>
          </section>

          {/* GENERATE BUTTON */}

          <button
            type='button'
            onClick={handleGenerate}
            disabled={!profileLoaded || exercises.length === 0}
            className='flex w-full items-center justify-center gap-3 rounded-xl bg-[#A4FF00] px-6 py-4 font-bold text-black transition hover:bg-[#b6ff40] disabled:cursor-not-allowed disabled:opacity-50'
          >
            {workout ? <RefreshCw size={20} /> : <Zap size={20} />}

            {workout ? "Regenerate Workout" : "Generate My Workout"}
          </button>

          <p className='text-center text-xs text-zinc-500'>
            {exercises.length} exercises in the SyntraFit library
          </p>
        </div>

        {/* GENERATED WORKOUT */}

        <div className='space-y-6 xl:sticky xl:top-6'>
          {!workout ? (
            <section className='flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#111111] p-8 text-center'>
              <div className='mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#A4FF00]/10'>
                <Zap
                  size={36}
                  className='text-[#A4FF00]'
                />
              </div>

              <h2 className='text-xl font-bold'>Your Next Workout</h2>

              <p className='mt-3 max-w-xs text-sm leading-relaxed text-zinc-500'>
                Choose your training preferences and generate a personalized
                workout using the SyntraFit intelligent training engine.
              </p>
            </section>
          ) : (
            <>
              {/* WORKOUT SUMMARY */}

              <section className='rounded-2xl border border-[#A4FF00]/20 bg-[#111111] p-5 sm:p-6'>
                <div className='mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A4FF00]'>
                  <Sparkles size={16} />
                  Generated Workout
                </div>

                <h2 className='text-2xl font-bold'>{workout.name}</h2>

                <div className='mt-6 grid grid-cols-3 gap-2'>
                  <div className='rounded-xl bg-[#1c1c1c] p-3'>
                    <Clock
                      size={18}
                      className='mb-2 text-[#A4FF00]'
                    />
                    <p className='text-2xl font-bold'>
                      {workout.estimatedMinutes}
                    </p>
                    <p className='text-xs text-zinc-500'>Est. minutes</p>
                  </div>

                  <div className='rounded-xl bg-[#1c1c1c] p-3'>
                    <Dumbbell
                      size={18}
                      className='mb-2 text-[#A4FF00]'
                    />
                    <p className='text-2xl font-bold'>
                      {workout.exercises.length}
                    </p>
                    <p className='text-xs text-zinc-500'>Exercises</p>
                  </div>

                  <div className='rounded-xl bg-[#1c1c1c] p-3'>
                    <Layers
                      size={18}
                      className='mb-2 text-[#A4FF00]'
                    />
                    <p className='text-2xl font-bold'>{workout.totalSets}</p>
                    <p className='text-xs text-zinc-500'>Total sets</p>
                  </div>
                </div>

                {workout.muscleGroups.length > 0 && (
                  <div className='mt-5'>
                    <p className='mb-3 text-xs text-zinc-500'>
                      Targeted Muscle Groups
                    </p>

                    <div className='flex flex-wrap gap-2'>
                      {workout.muscleGroups.map((group) => (
                        <span
                          key={group}
                          className='rounded-full bg-[#A4FF00]/10 px-3 py-1.5 text-xs text-[#A4FF00]'
                        >
                          {formatMuscleGroup(group)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* WARNINGS */}

              {workout.warnings.map((warning, index) => (
                <div
                  key={index}
                  className='flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400'
                >
                  <AlertCircle
                    size={18}
                    className='mt-0.5 shrink-0'
                  />
                  {warning}
                </div>
              ))}

              {/* EXERCISE LIST */}

              {workout.exercises.length > 0 && (
                <section className={cardClass}>
                  <h2 className='mb-5 font-semibold'>Workout Plan</h2>

                  <div className='mb-4 flex items-center gap-3 rounded-xl bg-[#1c1c1c] p-4'>
                    <Timer
                      size={20}
                      className='text-[#A4FF00]'
                    />

                    <div>
                      <p className='text-sm font-medium'>Warm-up</p>

                      <p className='text-xs text-zinc-500'>
                        3 minutes of light activity
                      </p>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {workout.exercises.map((item, index) => (
                      <div
                        key={item.exercise.id}
                        className='rounded-xl border border-white/10 bg-[#181818] p-4'
                      >
                        <div className='flex items-start gap-3'>
                          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#A4FF00]/10 text-sm font-bold text-[#A4FF00]'>
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className='min-w-0 flex-1'>
                            <h3 className='text-sm font-semibold'>
                              {item.exercise.name}
                            </h3>

                            <p className='mt-1 text-xs text-zinc-500'>
                              {formatMuscleGroup(item.exercise.muscle_group)}
                              {" · "}
                              {formatMuscleGroup(item.exercise.equipment)}
                            </p>
                          </div>
                        </div>

                        <div className='mt-4 grid grid-cols-3 gap-2'>
                          <div className='rounded-lg bg-[#101010] p-2.5 text-center'>
                            <p className='font-bold'>{item.sets}</p>
                            <p className='text-xs text-zinc-500'>Sets</p>
                          </div>

                          <div className='rounded-lg bg-[#101010] p-2.5 text-center'>
                            <p className='font-bold'>
                              {item.durationSeconds !== null
                                ? formatTime(item.durationSeconds)
                                : item.distanceMeters !== null
                                  ? `${item.distanceMeters}m`
                                  : (item.reps ?? "—")}
                            </p>

                            <p className='text-xs text-zinc-500'>
                              {item.durationSeconds !== null
                                ? "Duration"
                                : item.distanceMeters !== null
                                  ? "Distance"
                                  : "Reps"}
                            </p>
                          </div>

                          <div className='rounded-lg bg-[#101010] p-2.5 text-center'>
                            <p className='font-bold'>
                              {item.restSeconds > 0
                                ? formatTime(item.restSeconds)
                                : "—"}
                            </p>

                            <p className='text-xs text-zinc-500'>Rest</p>
                          </div>
                        </div>

                        {item.exercise.tracking_type === "reps_weight" && (
                          <p className='mt-3 text-xs text-zinc-500'>
                            Choose a manageable weight that allows controlled
                            repetitions and proper form.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className='mt-4 flex items-center gap-3 rounded-xl bg-[#1c1c1c] p-4'>
                    <Timer
                      size={20}
                      className='text-[#A4FF00]'
                    />

                    <div>
                      <p className='text-sm font-medium'>Cool-down</p>

                      <p className='text-xs text-zinc-500'>
                        2 minutes of light recovery activity
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {workout.exercises.length > 0 && (
                <section className={cardClass}>
                  {savedWorkoutId ? (
                    <div className='rounded-xl border border-[#A4FF00]/20 bg-[#A4FF00]/5 p-4'>
                      <p className='font-semibold text-[#A4FF00]'>
                        Workout saved successfully
                      </p>

                      <p className='mt-2 text-xs text-zinc-400'>
                        Your workout and exercise targets have been saved to
                        your account.
                      </p>

                      <p className='mt-3 break-all text-xs text-zinc-500'>
                        Workout ID: {savedWorkoutId}
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <button
                        type='button'
                        disabled={saving}
                        onClick={() => handleSaveWorkout(true)}
                        className='flex w-full items-center justify-center gap-3 rounded-xl bg-[#A4FF00] px-6 py-4 font-bold text-black transition hover:bg-[#b6ff40] disabled:opacity-50'
                      >
                        {saving ? (
                          <Loader2
                            size={20}
                            className='animate-spin'
                          />
                        ) : (
                          <Zap size={20} />
                        )}

                        {saving ? "Saving Workout..." : "Start Workout"}
                      </button>

                      <button
                        type='button'
                        disabled={saving}
                        onClick={() => handleSaveWorkout(false)}
                        className='flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#1c1c1c] px-6 py-4 font-semibold text-white transition hover:bg-[#252525] disabled:opacity-50'
                      >
                        <Layers size={20} />
                        Save for Later
                      </button>
                    </div>
                  )}
                </section>
              )}

              <p className='text-xs leading-relaxed text-zinc-500'>
                Workout durations are estimates. Adjust resistance, rest periods
                and exercise volume according to your ability.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
