// This barrel is the app's single import point for Prisma types and enums.
//
// Prisma 6's generated `index.js` bundles types AND runtime in one file,
// pulling in Node.js built-ins (node:events) that crash in browser bundles.
// We bypass that by:
//   1. Using `export type` for model types — TypeScript erases these at
//      compile time, so the JS file is never loaded for them.
//   2. Defining enum constants inline here — they are small and stable.
//
// Server-only modules (lib/db.ts, seeds, API routes) import PrismaClient
// directly from '@/prisma/generated/client'.

/* eslint-disable */

// ---- Model types (compile-time only, erased in JS output) ----
export type {
  User, Conversation, Message,
  Exercise, Program, Workout, ProgramExercise,
  Session, Set,
  ExerciseGoal, VolumeTarget,
  BodyweightEntry, BodyMeasurement,
  CoachSession, ReadinessCheckin,
} from '@/prisma/generated/index';

export type { Prisma } from '@/prisma/generated/index';

// ---- Enum runtime values (inline, no runtime dependency) ----
export const Sex = { MALE: 'MALE', FEMALE: 'FEMALE', OTHER: 'OTHER' } as const;
export type Sex = (typeof Sex)[keyof typeof Sex];

export const WeightUnit = { KG: 'KG', LB: 'LB' } as const;
export type WeightUnit = (typeof WeightUnit)[keyof typeof WeightUnit];

export const TrainingGoal = {
  HYPERTROPHY: 'HYPERTROPHY',
  STRENGTH: 'STRENGTH',
  FAT_LOSS: 'FAT_LOSS',
  RECOMP: 'RECOMP',
  GENERAL_FITNESS: 'GENERAL_FITNESS',
} as const;
export type TrainingGoal = (typeof TrainingGoal)[keyof typeof TrainingGoal];

export const MessageRole = { USER: 'USER', ASSISTANT: 'ASSISTANT' } as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const MuscleGroup = {
  CHEST: 'CHEST',
  BACK_WIDTH: 'BACK_WIDTH',
  BACK_THICKNESS: 'BACK_THICKNESS',
  SHOULDERS_FRONT: 'SHOULDERS_FRONT',
  SHOULDERS_LATERAL: 'SHOULDERS_LATERAL',
  SHOULDERS_REAR: 'SHOULDERS_REAR',
  BICEPS: 'BICEPS',
  TRICEPS: 'TRICEPS',
  FOREARMS: 'FOREARMS',
  QUADS: 'QUADS',
  HAMSTRINGS: 'HAMSTRINGS',
  GLUTES: 'GLUTES',
  CALVES: 'CALVES',
  ABS: 'ABS',
  LOWER_BACK: 'LOWER_BACK',
  OTHER: 'OTHER',
} as const;
export type MuscleGroup = (typeof MuscleGroup)[keyof typeof MuscleGroup];

export const ExerciseCategory = {
  COMPOUND: 'COMPOUND',
  ISOLATION: 'ISOLATION',
  CARDIO: 'CARDIO',
} as const;
export type ExerciseCategory = (typeof ExerciseCategory)[keyof typeof ExerciseCategory];

export const BodyMeasurementSite = {
  WAIST: 'WAIST',
  HIPS: 'HIPS',
  CHEST: 'CHEST',
  SHOULDERS: 'SHOULDERS',
  NECK: 'NECK',
  ARM_LEFT: 'ARM_LEFT',
  ARM_RIGHT: 'ARM_RIGHT',
  FOREARM_LEFT: 'FOREARM_LEFT',
  FOREARM_RIGHT: 'FOREARM_RIGHT',
  THIGH_LEFT: 'THIGH_LEFT',
  THIGH_RIGHT: 'THIGH_RIGHT',
  CALF_LEFT: 'CALF_LEFT',
  CALF_RIGHT: 'CALF_RIGHT',
} as const;
export type BodyMeasurementSite = (typeof BodyMeasurementSite)[keyof typeof BodyMeasurementSite];
