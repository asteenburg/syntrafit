export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  secondary_muscles: string[] | null;
  equipment: string;
  difficulty: string;
  category: string;
  tracking_type: string;
}

export type FitnessGoal =
  | "build_muscle"
  | "lose_weight"
  | "increase_strength"
  | "improve_endurance"
  | "general_fitness";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type TrainingFocus =
  | "full_body"
  | "upper_body"
  | "lower_body"
  | "push"
  | "pull"
  | "core"
  | "cardio"
  | "conditioning"
  | "custom";

export interface GeneratorOptions {
  goal: FitnessGoal;
  experience: ExperienceLevel;
  duration: number;
  focus: TrainingFocus;
  equipment: string[];
  muscleGroups?: string[];
  recentExerciseIds?: string[];
}

export interface GeneratedExercise {
  exercise: Exercise;
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  restSeconds: number;
  estimatedSeconds: number;
}

export interface GeneratedWorkout {
  name: string;
  focus: TrainingFocus;
  goal: FitnessGoal;
  exercises: GeneratedExercise[];
  estimatedMinutes: number;
  requestedMinutes: number;
  totalSets: number;
  muscleGroups: string[];
  warnings: string[];
}

const EQUIPMENT_MAP: Record<string, string> = {
  bodyweight: "bodyweight",
  dumbbells: "dumbbell",
  dumbbell: "dumbbell",
  barbells: "barbell",
  barbell: "barbell",
  kettlebells: "kettlebell",
  kettlebell: "kettlebell",
  "cable machines": "cable",
  cable: "cable",
  "gym machines": "machine",
  machine: "machine",
  "resistance bands": "resistance_band",
  "pull-up bar": "pull_up_bar",
  bench: "bench",
  treadmill: "treadmill",
  "rowing machine": "rowing_machine",
  rowing_machine: "rowing_machine",
  "stationary bike": "stationary_bike",
  stationary_bike: "stationary_bike",
  "dip station": "dip_station",
  "squat rack": "squat_rack",
};

const DIFFICULTY_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const FOCUS_GROUPS: Record<TrainingFocus, string[]> = {
  full_body: [
    "chest",
    "back",
    "quadriceps",
    "hamstrings",
    "glutes",
    "shoulders",
    "core",
    "calves",
    "biceps",
    "triceps",
    "forearms",
  ],
  upper_body: ["chest", "back", "shoulders", "biceps", "triceps", "forearms"],
  lower_body: ["quadriceps", "hamstrings", "glutes", "calves"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps", "forearms"],
  core: ["core"],
  cardio: ["cardio"],
  conditioning: ["full_body"],
  custom: [],
};

const FOCUS_NAMES: Record<TrainingFocus, string> = {
  full_body: "Full Body",
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  push: "Push Day",
  pull: "Pull Day",
  core: "Core",
  cardio: "Cardio",
  conditioning: "Conditioning",
  custom: "Custom",
};

const GOAL_NAMES: Record<FitnessGoal, string> = {
  build_muscle: "Muscle Building",
  lose_weight: "Fat Loss",
  increase_strength: "Strength",
  improve_endurance: "Endurance",
  general_fitness: "General Fitness",
};

const ADDITIONAL_EQUIPMENT: Record<string, string[]> = {
  "Pull-Up": ["pull_up_bar"],
  "Chin-Up": ["pull_up_bar"],
  "Hanging Leg Raise": ["pull_up_bar"],
  "Tricep Dip": ["dip_station"],
  "Barbell Bench Press": ["bench", "squat_rack"],
  "Dumbbell Bench Press": ["bench"],
  "Dumbbell Chest Fly": ["bench"],
  "Incline Barbell Bench Press": ["bench", "squat_rack"],
  "Incline Dumbbell Press": ["bench"],
  "Close Grip Bench Press": ["bench", "squat_rack"],
  "Skull Crusher": ["bench"],
  "Barbell Hip Thrust": ["bench"],
  "Bulgarian Split Squat": ["bench"],
  "Barbell Back Squat": ["squat_rack"],
  "Barbell Front Squat": ["squat_rack"],
};

const COMPOUND_EXERCISES = new Set([
  "Barbell Bent Over Row",
  "Barbell Deadlift",
  "Chin-Up",
  "Lat Pulldown",
  "Machine Row",
  "Pull-Up",
  "Seated Cable Row",
  "Single Arm Dumbbell Row",
  "Barbell Bench Press",
  "Dumbbell Bench Press",
  "Incline Barbell Bench Press",
  "Incline Dumbbell Press",
  "Machine Chest Press",
  "Push-Up",
  "Barbell Hip Thrust",
  "Glute Bridge",
  "Romanian Deadlift",
  "Barbell Back Squat",
  "Barbell Front Squat",
  "Bulgarian Split Squat",
  "Dumbbell Lunge",
  "Goblet Squat",
  "Leg Press",
  "Barbell Overhead Press",
  "Dumbbell Shoulder Press",
  "Machine Shoulder Press",
  "Close Grip Bench Press",
  "Tricep Dip",
  "Kettlebell Swing",
  "Burpee",
]);

const UNILATERAL_EXERCISES = new Set([
  "Single Arm Dumbbell Row",
  "Bulgarian Split Squat",
  "Dumbbell Lunge",
  "Cable Glute Kickback",
  "Side Plank",
]);

function normalizeEquipment(equipment: string[]): Set<string> {
  return new Set(
    equipment.map((item) => {
      const key = item.trim().toLowerCase();
      return EQUIPMENT_MAP[key] ?? key;
    }),
  );
}

function equipmentMatches(exercise: Exercise, available: Set<string>): boolean {
  if (
    exercise.equipment !== "bodyweight" &&
    !available.has(exercise.equipment)
  ) {
    return false;
  }

  const additional = ADDITIONAL_EQUIPMENT[exercise.name] ?? [];

  return additional.every((item) => available.has(item));
}

function difficultyMatches(
  exercise: Exercise,
  experience: ExperienceLevel,
): boolean {
  const exerciseRank = DIFFICULTY_RANK[exercise.difficulty];

  const userRank = DIFFICULTY_RANK[experience];

  return exerciseRank !== undefined && exerciseRank <= userRank;
}

function focusMatches(exercise: Exercise, options: GeneratorOptions): boolean {
  const focus = options.focus;

  if (focus === "cardio") {
    return exercise.category === "cardio";
  }

  if (focus === "conditioning") {
    return exercise.category === "conditioning";
  }

  if (exercise.category === "cardio" || exercise.category === "conditioning") {
    return false;
  }

  if (
    focus === "pull" &&
    ["Cable Face Pull", "Reverse Dumbbell Fly"].includes(exercise.name)
  ) {
    return true;
  }

  if (
    focus === "push" &&
    ["Cable Face Pull", "Reverse Dumbbell Fly"].includes(exercise.name)
  ) {
    return false;
  }

  if (focus === "lower_body" && exercise.name === "Barbell Deadlift") {
    return true;
  }

  const groups =
    focus === "custom"
      ? (options.muscleGroups ?? []).map((group) => group.trim().toLowerCase())
      : FOCUS_GROUPS[focus];

  return groups.includes(exercise.muscle_group);
}

function getPrescription(
  exercise: Exercise,
  options: GeneratorOptions,
): GeneratedExercise {
  const beginner = options.experience === "beginner";
  const advanced = options.experience === "advanced";
  const compound = COMPOUND_EXERCISES.has(exercise.name);
  const unilateral = UNILATERAL_EXERCISES.has(exercise.name);

  let sets = 3;
  let reps: number | null = 12;
  let durationSeconds: number | null = null;
  let distanceMeters: number | null = null;
  let restSeconds = 60;

  switch (options.goal) {
    case "build_muscle":
      sets = beginner ? 2 : advanced ? 4 : 3;
      reps = compound ? 10 : 12;
      restSeconds = compound ? 120 : 90;
      break;

    case "increase_strength":
      sets = beginner ? 2 : advanced ? 4 : 3;
      reps = beginner ? 8 : compound ? 5 : 10;
      restSeconds = compound ? 180 : 90;
      break;

    case "lose_weight":
      sets = beginner ? 2 : 3;
      reps = 12;
      restSeconds = 60;
      break;

    case "improve_endurance":
      sets = beginner ? 2 : 3;
      reps = beginner ? 12 : 15;
      restSeconds = 60;
      break;

    case "general_fitness":
      sets = beginner ? 2 : 3;
      reps = 10;
      restSeconds = 90;
      break;
  }

  if (exercise.category === "conditioning") {
    sets = beginner ? 2 : 3;
    reps = 10;
    restSeconds = 90;
  }

  if (exercise.category === "cardio") {
    sets = 1;
    reps = null;
    restSeconds = 0;

    durationSeconds = Math.max(1, options.duration - 5) * 60;

    // Time-based cardio targets avoid assuming
    // the user's running or rowing speed.
    distanceMeters = null;
  } else if (exercise.tracking_type === "duration") {
    reps = null;
    durationSeconds = beginner ? 20 : advanced ? 45 : 30;
    restSeconds = 60;
  } else if (exercise.tracking_type === "reps") {
    reps = Math.min(reps ?? 10, beginner ? 8 : 12);

    if (["Pull-Up", "Chin-Up", "Tricep Dip"].includes(exercise.name)) {
      reps = advanced ? 8 : 5;
    }
  }

  const workSeconds =
    (durationSeconds ?? (reps ?? 0) * 4) * (unilateral ? 2 : 1);

  const estimatedSeconds =
    sets * workSeconds + Math.max(0, sets - 1) * restSeconds + 45;

  return {
    exercise,
    sets,
    reps,
    durationSeconds,
    distanceMeters,
    restSeconds,
    estimatedSeconds,
  };
}

function scoreExercise(
  exercise: Exercise,
  selected: GeneratedExercise[],
  options: GeneratorOptions,
): number {
  let score = Math.random() * 10;

  const primaryCount = selected.filter(
    (item) => item.exercise.muscle_group === exercise.muscle_group,
  ).length;

  score -= primaryCount * 25;

  if (COMPOUND_EXERCISES.has(exercise.name)) {
    score += 20;
  }

  if (options.recentExerciseIds?.includes(exercise.id)) {
    score -= 15;
  }

  const targetedMuscles = new Set(
    selected.flatMap((item) => [
      item.exercise.muscle_group,
      ...(item.exercise.secondary_muscles ?? []),
    ]),
  );

  if (!targetedMuscles.has(exercise.muscle_group)) {
    score += 15;
  }

  for (const muscle of exercise.secondary_muscles ?? []) {
    if (targetedMuscles.has(muscle)) {
      score -= 3;
    }
  }

  if (options.focus === "full_body") {
    const upperGroups = FOCUS_GROUPS.upper_body;
    const lowerGroups = FOCUS_GROUPS.lower_body;

    const upperCount = selected.filter((item) =>
      upperGroups.includes(item.exercise.muscle_group),
    ).length;

    const lowerCount = selected.filter((item) =>
      lowerGroups.includes(item.exercise.muscle_group),
    ).length;

    if (
      upperCount > lowerCount &&
      lowerGroups.includes(exercise.muscle_group)
    ) {
      score += 35;
    }

    if (
      lowerCount > upperCount &&
      upperGroups.includes(exercise.muscle_group)
    ) {
      score += 35;
    }
  }

  return score;
}

export function generateWorkout(
  exercises: Exercise[],
  options: GeneratorOptions,
): GeneratedWorkout {
  const warnings: string[] = [];
  const available = normalizeEquipment(options.equipment);

  const candidates = exercises.filter(
    (exercise) =>
      equipmentMatches(exercise, available) &&
      difficultyMatches(exercise, options.experience) &&
      focusMatches(exercise, options),
  );

  const selected: GeneratedExercise[] = [];

  // Reserve five minutes for warm-up and cool-down.
  const reservedSeconds = 300;
  const budget = Math.max(0, options.duration * 60 - reservedSeconds);

  let usedSeconds = 0;

  const maxExercises =
    options.focus === "cardio"
      ? 1
      : Math.min(10, Math.max(1, Math.ceil(options.duration / 6)));

  while (selected.length < maxExercises) {
    const remaining = candidates.filter(
      (exercise) => !selected.some((item) => item.exercise.id === exercise.id),
    );

    if (remaining.length === 0) break;

    const ranked = remaining
      .map((exercise) => ({
        exercise,
        score: scoreExercise(exercise, selected, options),
      }))
      .sort((a, b) => b.score - a.score);

    let added = false;

    for (const candidate of ranked) {
      const prescription = getPrescription(candidate.exercise, options);

      // Cardio has no equipment transition
      // within a single-exercise session.
      if (options.focus === "cardio") {
        prescription.estimatedSeconds = prescription.durationSeconds ?? 0;
      }

      while (
        prescription.sets > 1 &&
        usedSeconds + prescription.estimatedSeconds > budget
      ) {
        const workSeconds =
          (prescription.durationSeconds ?? (prescription.reps ?? 0) * 4) *
          (UNILATERAL_EXERCISES.has(prescription.exercise.name) ? 2 : 1);

        prescription.sets -= 1;

        prescription.estimatedSeconds =
          prescription.sets * workSeconds +
          Math.max(0, prescription.sets - 1) * prescription.restSeconds +
          45;
      }

      if (usedSeconds + prescription.estimatedSeconds <= budget) {
        selected.push(prescription);
        usedSeconds += prescription.estimatedSeconds;
        added = true;
        break;
      }
    }

    if (!added) break;
  }

  // Compound movements before isolation exercises.
  selected.sort(
    (a, b) =>
      Number(COMPOUND_EXERCISES.has(b.exercise.name)) -
      Number(COMPOUND_EXERCISES.has(a.exercise.name)),
  );

  const muscleGroups = [
    ...new Set(
      selected.flatMap((item) => [
        item.exercise.muscle_group,
        ...(item.exercise.secondary_muscles ?? []),
      ]),
    ),
  ];

  if (selected.length === 0) {
    warnings.push(
      "No suitable exercises match your current equipment, experience and training focus.",
    );
  } else if (usedSeconds < budget * 0.65) {
    warnings.push(
      "The available exercise library could not fill your requested workout duration.",
    );
  }

  if (options.focus === "full_body" && selected.length > 0) {
    const hasUpper = selected.some((item) =>
      FOCUS_GROUPS.upper_body.includes(item.exercise.muscle_group),
    );

    const hasLower = selected.some((item) =>
      FOCUS_GROUPS.lower_body.includes(item.exercise.muscle_group),
    );

    if (!hasUpper || !hasLower) {
      warnings.push(
        "Equipment or exercise availability limits balanced full-body training.",
      );
    }
  }

  if (options.focus === "custom") {
    const missing = (options.muscleGroups ?? [])
      .map((group) => group.toLowerCase())
      .filter((group) => !muscleGroups.includes(group));

    if (missing.length > 0) {
      warnings.push(`Unable to target: ${missing.join(", ")}.`);
    }
  }

  return {
    name: `${FOCUS_NAMES[options.focus]} - ${GOAL_NAMES[options.goal]}`,
    focus: options.focus,
    goal: options.goal,
    exercises: selected,
    estimatedMinutes:
      selected.length === 0
        ? 0
        : Math.ceil((usedSeconds + reservedSeconds) / 60),
    requestedMinutes: options.duration,
    totalSets: selected.reduce((total, item) => total + item.sets, 0),
    muscleGroups,
    warnings,
  };
}
