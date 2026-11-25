"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  Dumbbell,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  LoaderCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string;
  category: string;
  difficulty: string;
  tracking_type: string;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function difficultyStyle(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return "bg-green-500/10 text-green-400";
    case "intermediate":
      return "bg-amber-500/10 text-amber-400";
    case "advanced":
      return "bg-red-500/10 text-red-400";
    default:
      return "bg-white/5 text-zinc-400";
  }
}

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("exercises")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;

        if (!cancelled) {
          setExercises(data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the exercise library.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExercises();

    return () => {
      cancelled = true;
    };
  }, []);

  const muscleGroups = useMemo(
    () =>
      [...new Set(exercises.map((exercise) => exercise.muscle_group))]
        .filter(Boolean)
        .sort(),
    [exercises],
  );

  const equipmentTypes = useMemo(
    () =>
      [...new Set(exercises.map((exercise) => exercise.equipment))]
        .filter(Boolean)
        .sort(),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const searchableText = [
        exercise.name,
        exercise.muscle_group,
        exercise.equipment,
        exercise.category,
        ...(exercise.secondary_muscles ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/_/g, " ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesMuscle =
        muscle === "all" || exercise.muscle_group === muscle;

      const matchesEquipment =
        equipment === "all" || exercise.equipment === equipment;

      const matchesDifficulty =
        difficulty === "all" || exercise.difficulty === difficulty;

      return (
        matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty
      );
    });
  }, [exercises, search, muscle, equipment, difficulty]);

  const hasFilters =
    search !== "" ||
    muscle !== "all" ||
    equipment !== "all" ||
    difficulty !== "all";

  function resetFilters() {
    setSearch("");
    setMuscle("all");
    setEquipment("all");
    setDifficulty("all");
    setExpandedId(null);
  }

  return (
    <main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10'>
      {/* Page heading */}
      <header className='mb-8'>
        <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-[#A4FF00]'>
          SyntraFit / Training
        </p>

        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Exercise Library
        </h1>

        <p className='mt-2 text-sm text-zinc-400'>
          Discover exercises and build better workouts.
        </p>
      </header>

      {/* Loading state */}
      {loading ? (
        <div className='flex min-h-64 flex-col items-center justify-center gap-4'>
          <LoaderCircle
            size={32}
            className='animate-spin text-[#A4FF00]'
          />

          <p className='text-sm text-zinc-400'>Loading exercise library...</p>
        </div>
      ) : error ? (
        <div className='rounded-2xl border border-red-500/20 bg-red-500/5 p-6'>
          <AlertCircle className='mb-3 text-red-400' />

          <h2 className='font-semibold text-red-400'>
            Unable to load exercises
          </h2>

          <p className='mt-2 text-sm text-zinc-400'>{error}</p>

          <button
            onClick={() => window.location.reload()}
            className='mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm'
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Library statistics */}
          <section className='mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3'>
            <div className='rounded-2xl border border-white/5 bg-[#151515] p-4 sm:p-5'>
              <Dumbbell
                size={22}
                className='mb-4 text-[#A4FF00]'
              />

              <p className='text-3xl font-bold'>{exercises.length}</p>

              <p className='mt-1 text-xs text-zinc-400 sm:text-sm'>
                Total exercises
              </p>
            </div>

            <div className='rounded-2xl border border-white/5 bg-[#151515] p-4 sm:p-5'>
              <Layers
                size={22}
                className='mb-4 text-[#A4FF00]'
              />

              <p className='text-3xl font-bold'>{muscleGroups.length}</p>

              <p className='mt-1 text-xs text-zinc-400 sm:text-sm'>
                Muscle groups
              </p>
            </div>

            <div className='hidden rounded-2xl border border-white/5 bg-[#151515] p-5 lg:block'>
              <SlidersHorizontal
                size={22}
                className='mb-4 text-[#A4FF00]'
              />

              <p className='text-3xl font-bold'>{equipmentTypes.length}</p>

              <p className='mt-1 text-sm text-zinc-400'>Equipment types</p>
            </div>
          </section>

          {/* Search */}
          <section className='mb-6 space-y-4'>
            <div className='relative'>
              <Search
                size={20}
                className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500'
              />

              <input
                type='search'
                aria-label='Search exercises'
                placeholder='Search exercises...'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className='w-full rounded-xl border border-white/10 bg-[#151515] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#A4FF00]/50'
              />

              {search && (
                <button
                  type='button'
                  aria-label='Clear search'
                  onClick={() => setSearch("")}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400'
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Muscle group filters */}
            <div className='flex flex-wrap gap-2'>
              {["all", ...muscleGroups].map((group) => (
                <button
                  key={group}
                  type='button'
                  aria-pressed={muscle === group}
                  onClick={() => setMuscle(group)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    muscle === group
                      ? "bg-[#A4FF00] text-black"
                      : "bg-[#191919] text-zinc-400 hover:text-white"
                  }`}
                >
                  {group === "all" ? "All" : formatLabel(group)}
                </button>
              ))}
            </div>

            {/* Additional filters */}
            <div className='grid grid-cols-2 gap-3'>
              <select
                aria-label='Filter by equipment'
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
                className='min-w-0 rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-sm text-zinc-300 outline-none focus:border-[#A4FF00]/50'
              >
                <option value='all'>All equipment</option>

                {equipmentTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {formatLabel(type)}
                  </option>
                ))}
              </select>

              <select
                aria-label='Filter by difficulty'
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className='min-w-0 rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-sm text-zinc-300 outline-none focus:border-[#A4FF00]/50'
              >
                <option value='all'>All difficulties</option>
                <option value='beginner'>Beginner</option>
                <option value='intermediate'>Intermediate</option>
                <option value='advanced'>Advanced</option>
              </select>
            </div>
          </section>

          {/* Results heading */}
          <div className='mb-4 flex items-center justify-between gap-3'>
            <p className='text-sm text-zinc-400'>
              Showing{" "}
              <span className='font-semibold text-white'>
                {filteredExercises.length}
              </span>{" "}
              of {exercises.length} exercises
            </p>

            {hasFilters && (
              <button
                type='button'
                onClick={resetFilters}
                className='text-xs font-medium text-[#A4FF00]'
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Exercise results */}
          {filteredExercises.length === 0 ? (
            <div className='rounded-2xl border border-white/5 bg-[#151515] px-6 py-12 text-center'>
              <Search
                size={32}
                className='mx-auto mb-4 text-zinc-600'
              />

              <h2 className='font-semibold'>No exercises found</h2>

              <p className='mt-2 text-sm text-zinc-500'>
                Try adjusting your search or filters.
              </p>

              <button
                onClick={resetFilters}
                className='mt-5 rounded-lg bg-[#A4FF00] px-4 py-2 text-sm font-semibold text-black'
              >
                Reset filters
              </button>
            </div>
          ) : (
            <section className='grid grid-cols-1 items-start gap-3 xl:grid-cols-2'>
              {filteredExercises.map((exercise) => {
                const expanded = expandedId === exercise.id;

                return (
                  <article
                    key={exercise.id}
                    className={`overflow-hidden rounded-2xl border bg-[#151515] transition ${
                      expanded
                        ? "border-[#A4FF00]/30"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <button
                      type='button'
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedId(expanded ? null : exercise.id)
                      }
                      className='flex w-full items-center gap-3 p-4 text-left'
                    >
                      <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#A4FF00]/10'>
                        <Dumbbell
                          size={23}
                          className='text-[#A4FF00]'
                        />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <h2 className='text-sm font-semibold text-white sm:text-base'>
                          {exercise.name}
                        </h2>

                        <p className='mt-1 text-xs text-zinc-400'>
                          {formatLabel(exercise.muscle_group)}
                          {" · "}
                          {formatLabel(exercise.equipment)}
                        </p>

                        <span
                          className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-medium ${difficultyStyle(
                            exercise.difficulty,
                          )}`}
                        >
                          {formatLabel(exercise.difficulty)}
                        </span>
                      </div>

                      {expanded ? (
                        <ChevronUp
                          size={18}
                          className='shrink-0 text-[#A4FF00]'
                        />
                      ) : (
                        <ChevronDown
                          size={18}
                          className='shrink-0 text-zinc-500'
                        />
                      )}
                    </button>

                    {/* Expanded exercise details */}
                    {expanded && (
                      <div className='space-y-5 border-t border-white/5 px-4 py-5'>
                        <div className='grid grid-cols-2 gap-3'>
                          <div className='rounded-xl bg-black/20 p-3'>
                            <p className='text-xs text-zinc-500'>Category</p>

                            <p className='mt-1 text-sm font-medium'>
                              {formatLabel(exercise.category)}
                            </p>
                          </div>

                          <div className='rounded-xl bg-black/20 p-3'>
                            <p className='text-xs text-zinc-500'>Tracking</p>

                            <p className='mt-1 text-sm font-medium'>
                              {formatLabel(exercise.tracking_type)}
                            </p>
                          </div>
                        </div>

                        {Boolean(exercise.secondary_muscles?.length) && (
                          <div>
                            <h3 className='mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500'>
                              Secondary muscles
                            </h3>

                            <div className='flex flex-wrap gap-2'>
                              {exercise.secondary_muscles?.map((group) => (
                                <span
                                  key={group}
                                  className='rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300'
                                >
                                  {formatLabel(group)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {exercise.description && (
                          <div>
                            <h3 className='mb-2 text-sm font-semibold'>
                              About this exercise
                            </h3>

                            <p className='text-sm leading-relaxed text-zinc-400'>
                              {exercise.description}
                            </p>
                          </div>
                        )}

                        <div>
                          <h3 className='mb-2 text-sm font-semibold'>
                            Instructions
                          </h3>

                          <p className='whitespace-pre-line text-sm leading-relaxed text-zinc-400'>
                            {exercise.instructions ||
                              "Detailed instructions coming soon."}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}
