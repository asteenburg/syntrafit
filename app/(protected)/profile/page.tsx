"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Target,
  Dumbbell,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings2,
} from "lucide-react";

const supabase = createClient();

const FITNESS_GOALS = [
  { value: "build_muscle", label: "Build Muscle" },
  { value: "lose_weight", label: "Lose Weight" },
  { value: "increase_strength", label: "Increase Strength" },
  { value: "improve_endurance", label: "Improve Endurance" },
  { value: "general_fitness", label: "General Fitness" },
];

const EQUIPMENT = [
  "Bodyweight",
  "Dumbbells",
  "Barbells",
  "Kettlebells",
  "Cable Machines",
  "Resistance Bands",
  "Gym Machines",
  "Pull-up Bar",
  "Bench",
  "Treadmill",
];

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#1c1c1c] px-4 py-3 text-sm text-white outline-none transition focus:border-[#A4FF00]";

const labelClass = "mb-2 block text-sm font-medium text-zinc-400";

const cardClass = "rounded-2xl border border-white/10 bg-[#111111] p-5 sm:p-6";

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);

  const [experienceLevel, setExperienceLevel] = useState("beginner");

  const [fitnessGoal, setFitnessGoal] = useState("");
  const [duration, setDuration] = useState(45);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);

  const [equipment, setEquipment] = useState<string[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);

  const [measurementSystem, setMeasurementSystem] = useState("imperial");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("User not authenticated.");

        setUserId(user.id);
        setEmail(user.email ?? "");

        const [profileResult, preferencesResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),

          supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (preferencesResult.error) {
          throw preferencesResult.error;
        }

        const profile = profileResult.data;
        const preferences = preferencesResult.data;

        setFullName(profile.full_name ?? "");
        setDateOfBirth(profile.date_of_birth ?? "");

        setHeightCm(
          profile.height_cm == null ? null : Number(profile.height_cm),
        );

        setWeightKg(
          profile.weight_kg == null ? null : Number(profile.weight_kg),
        );

        setExperienceLevel(preferences.experience_level ?? "beginner");

        setFitnessGoal(preferences.fitness_goal ?? "");
        setDuration(preferences.preferred_duration ?? 45);
        setWorkoutsPerWeek(preferences.workouts_per_week ?? 3);

        setEquipment(preferences.available_equipment ?? []);
        setMuscleGroups(preferences.preferred_muscle_groups ?? []);

        setMeasurementSystem(preferences.measurement_system ?? "imperial");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function toggleEquipment(value: string) {
    setEquipment((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  }

  function toggleMuscleGroup(value: string) {
    setMuscleGroups((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  }

  async function saveProfile() {
    if (!userId || saving) return;

    setSaving(true);
    setSuccess("");
    setError("");

    try {
      if (heightCm !== null && heightCm <= 0) {
        throw new Error("Please enter a valid height.");
      }

      if (weightKg !== null && weightKg <= 0) {
        throw new Error("Please enter a valid weight.");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          date_of_birth: dateOfBirth || null,
          height_cm: heightCm === null ? null : Number(heightCm.toFixed(2)),
          weight_kg: weightKg === null ? null : Number(weightKg.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      const { error: preferencesError } = await supabase
        .from("user_preferences")
        .update({
          experience_level: experienceLevel,
          fitness_goal: fitnessGoal || null,
          preferred_duration: duration,
          workouts_per_week: workoutsPerWeek,
          available_equipment: equipment,
          preferred_muscle_groups: muscleGroups,
          measurement_system: measurementSystem,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (preferencesError) throw preferencesError;

      setSuccess("Your profile and preferences have been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalInches = heightCm === null ? null : Math.round(heightCm / 2.54);

  const heightFeet = totalInches === null ? "" : Math.floor(totalInches / 12);

  const heightInches = totalInches === null ? "" : totalInches % 12;

  const displayWeight =
    weightKg === null
      ? ""
      : measurementSystem === "imperial"
        ? Number((weightKg * 2.2046226218).toFixed(1))
        : Number(weightKg.toFixed(1));

  if (loading) {
    return (
      <div className='flex min-h-[70vh] items-center justify-center'>
        <Loader2
          className='animate-spin text-[#A4FF00]'
          size={32}
        />
      </div>
    );
  }

  return (
    <main className='mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10'>
      {/* PAGE HEADER */}

      <div className='mb-8'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#A4FF00]'>
          Account Settings
        </p>

        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Your Profile
        </h1>

        <p className='mt-2 text-sm text-zinc-400'>
          Personalize your SyntraFit training experience.
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

      {success && (
        <div className='mb-6 flex items-center gap-3 rounded-xl border border-[#A4FF00]/20 bg-[#A4FF00]/10 p-4 text-sm text-[#A4FF00]'>
          <CheckCircle2
            size={20}
            className='shrink-0'
          />
          {success}
        </div>
      )}

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* PERSONAL INFORMATION */}

        <section className={cardClass}>
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
              <User
                className='text-[#A4FF00]'
                size={23}
              />
            </div>

            <div>
              <h2 className='font-semibold'>Personal Information</h2>
              <p className='text-xs text-zinc-500'>
                Manage your personal details
              </p>
            </div>
          </div>

          <div className='space-y-5'>
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder='Your full name'
              />
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <input
                className={`${inputClass} cursor-not-allowed opacity-60`}
                value={email}
                readOnly
              />
              <p className='mt-2 text-xs text-zinc-500'>
                Linked to your SyntraFit account.
              </p>
            </div>

            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                type='date'
                className={`${inputClass} [color-scheme:dark]`}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Measurement System</label>

              <div className='grid grid-cols-2 gap-2'>
                {["imperial", "metric"].map((system) => (
                  <button
                    key={system}
                    type='button'
                    onClick={() => setMeasurementSystem(system)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                      measurementSystem === system
                        ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                        : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                    }`}
                  >
                    {system}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Height</label>

              {measurementSystem === "imperial" ? (
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <input
                      type='number'
                      min='0'
                      className={inputClass}
                      placeholder='Feet'
                      value={heightFeet}
                      onChange={(e) => {
                        const feet = Number(e.target.value);
                        const inches = Number(heightInches || 0);

                        setHeightCm(
                          e.target.value === "" && inches === 0
                            ? null
                            : (feet * 12 + inches) * 2.54,
                        );
                      }}
                    />
                    <p className='mt-1 text-xs text-zinc-500'>Feet</p>
                  </div>

                  <div>
                    <input
                      type='number'
                      min='0'
                      max='11'
                      className={inputClass}
                      placeholder='Inches'
                      value={heightInches}
                      onChange={(e) => {
                        const inches = Math.min(
                          11,
                          Math.max(0, Number(e.target.value)),
                        );

                        const feet = Number(heightFeet || 0);

                        setHeightCm((feet * 12 + inches) * 2.54);
                      }}
                    />
                    <p className='mt-1 text-xs text-zinc-500'>Inches</p>
                  </div>
                </div>
              ) : (
                <input
                  type='number'
                  min='0'
                  step='0.1'
                  className={inputClass}
                  placeholder='Height in cm'
                  value={heightCm === null ? "" : Number(heightCm.toFixed(1))}
                  onChange={(e) =>
                    setHeightCm(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              )}
            </div>

            <div>
              <label className={labelClass}>
                Weight ({measurementSystem === "imperial" ? "lbs" : "kg"})
              </label>

              <input
                type='number'
                min='0'
                step='0.1'
                className={inputClass}
                value={displayWeight}
                placeholder='Enter your weight'
                onChange={(e) => {
                  if (e.target.value === "") {
                    setWeightKg(null);
                    return;
                  }

                  const value = Number(e.target.value);

                  setWeightKg(
                    measurementSystem === "imperial"
                      ? value / 2.2046226218
                      : value,
                  );
                }}
              />
            </div>
          </div>
        </section>

        {/* FITNESS PREFERENCES */}

        <section className={cardClass}>
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
              <Target
                className='text-[#A4FF00]'
                size={23}
              />
            </div>

            <div>
              <h2 className='font-semibold'>Fitness Preferences</h2>
              <p className='text-xs text-zinc-500'>
                Customize your training experience
              </p>
            </div>
          </div>

          <div className='space-y-5'>
            <div>
              <label className={labelClass}>Primary Goal</label>
              <select
                className={inputClass}
                value={fitnessGoal}
                onChange={(e) => setFitnessGoal(e.target.value)}
              >
                <option value=''>Select your goal</option>

                {FITNESS_GOALS.map((goal) => (
                  <option
                    key={goal.value}
                    value={goal.value}
                  >
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Experience Level</label>

              <div className='grid gap-2'>
                {[
                  {
                    value: "beginner",
                    label: "Beginner",
                    description: "New to structured training",
                  },
                  {
                    value: "intermediate",
                    label: "Intermediate",
                    description: "Regular training experience",
                  },
                  {
                    value: "advanced",
                    label: "Advanced",
                    description: "Extensive training experience",
                  },
                ].map((level) => (
                  <button
                    type='button'
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      experienceLevel === level.value
                        ? "border-[#A4FF00] bg-[#A4FF00]/5"
                        : "border-white/10 bg-[#1c1c1c]"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        experienceLevel === level.value
                          ? "text-[#A4FF00]"
                          : "text-white"
                      }`}
                    >
                      {level.label}
                    </p>

                    <p className='mt-1 text-xs text-zinc-500'>
                      {level.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Preferred Workout Duration</label>

              <select
                className={inputClass}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {[15, 20, 30, 45, 60, 75, 90].map((minutes) => (
                  <option
                    key={minutes}
                    value={minutes}
                  >
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Workouts Per Week</label>

              <div className='grid grid-cols-7 gap-1.5'>
                {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                  <button
                    type='button'
                    key={days}
                    onClick={() => setWorkoutsPerWeek(days)}
                    className={`rounded-lg border py-3 text-sm font-semibold transition ${
                      workoutsPerWeek === days
                        ? "border-[#A4FF00] bg-[#A4FF00] text-black"
                        : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>

              <p className='mt-2 text-xs text-zinc-500'>
                {workoutsPerWeek} training{" "}
                {workoutsPerWeek === 1 ? "day" : "days"} per week
              </p>
            </div>
          </div>
        </section>

        {/* AVAILABLE EQUIPMENT */}

        <section className={cardClass}>
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
              <Dumbbell
                className='text-[#A4FF00]'
                size={23}
              />
            </div>

            <div>
              <h2 className='font-semibold'>Available Equipment</h2>
              <p className='text-xs text-zinc-500'>
                Select the equipment you can access
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            {EQUIPMENT.map((item) => {
              const selected = equipment.includes(item);

              return (
                <button
                  type='button'
                  key={item}
                  onClick={() => toggleEquipment(item)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                    selected
                      ? "border-[#A4FF00] bg-[#A4FF00]/5 text-[#A4FF00]"
                      : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-[#A4FF00] bg-[#A4FF00]"
                        : "border-zinc-600"
                    }`}
                  >
                    {selected && (
                      <span className='text-xs font-bold text-black'>✓</span>
                    )}
                  </div>

                  {item}
                </button>
              );
            })}
          </div>

          <p className='mt-4 text-xs text-zinc-500'>
            {equipment.length} equipment options selected
          </p>
        </section>

        {/* PREFERRED MUSCLE GROUPS */}

        <section className={cardClass}>
          <div className='mb-6 flex items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
              <Settings2
                className='text-[#A4FF00]'
                size={23}
              />
            </div>

            <div>
              <h2 className='font-semibold'>Preferred Muscle Groups</h2>
              <p className='text-xs text-zinc-500'>
                Choose your training priorities
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {MUSCLE_GROUPS.map((group) => {
              const selected = muscleGroups.includes(group);

              return (
                <button
                  type='button'
                  key={group}
                  aria-pressed={selected}
                  onClick={() => toggleMuscleGroup(group)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                    selected
                      ? "border-[#A4FF00] bg-[#A4FF00]/10 text-[#A4FF00]"
                      : "border-white/10 bg-[#1c1c1c] text-zinc-400"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>

          <p className='mt-4 text-xs leading-relaxed text-zinc-500'>
            Leave these unselected if you prefer balanced full-body training
            without specific muscle priorities.
          </p>
        </section>
      </div>

      {/* SAVE BUTTON */}

      <div className='mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs text-zinc-500'>
          Your preferences will be used to personalize future workouts.
        </p>

        <button
          type='button'
          onClick={saveProfile}
          disabled={saving || !userId}
          className='flex items-center justify-center gap-2 rounded-xl bg-[#A4FF00] px-7 py-3.5 text-sm font-bold text-black transition hover:bg-[#b6ff40] disabled:cursor-not-allowed disabled:opacity-50'
        >
          {saving ? (
            <Loader2
              size={18}
              className='animate-spin'
            />
          ) : (
            <Save size={18} />
          )}

          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}
