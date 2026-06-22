import { z } from 'zod';
import { MuscleGroup, ExerciseCategory } from '@/lib/prisma-client';

export const muscleGroupValues = Object.values(MuscleGroup) as [MuscleGroup, ...MuscleGroup[]];
export const exerciseCategoryValues = Object.values(ExerciseCategory) as [
  ExerciseCategory,
  ...ExerciseCategory[],
];

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(120, 'Too long'),
  muscleGroup: z.enum(muscleGroupValues),
  category: z.enum(exerciseCategoryValues),
  defaultRestSec: z.coerce.number().int().min(15).max(600).default(90),
  notes: z.string().trim().max(2000).optional().nullable(),
  // For bodyweight exercises (pull-ups, dips...): the effective
  // tonnage includes User.bodyweight.
  usesBodyweight: z.coerce.boolean().default(false),
});

export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  CHEST: '胸',
  BACK_WIDTH: '背（宽度）',
  BACK_THICKNESS: '背（厚度）',
  SHOULDERS_FRONT: '前三角',
  SHOULDERS_LATERAL: '中三角',
  SHOULDERS_REAR: '后三角',
  BICEPS: '二头',
  TRICEPS: '三头',
  FOREARMS: '前臂',
  QUADS: '股四头',
  HAMSTRINGS: '腘绳肌',
  GLUTES: '臀',
  CALVES: '小腿',
  ABS: '腹',
  LOWER_BACK: '下背',
  OTHER: '其他',
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  COMPOUND: '复合',
  ISOLATION: '孤立',
  CARDIO: '有氧',
};
