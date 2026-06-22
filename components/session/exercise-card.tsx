'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, TrendingUp } from 'lucide-react';
import type { Exercise, MuscleGroup, ProgramExercise, WeightUnit } from '@/lib/prisma-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MUSCLE_GROUP_LABELS, CATEGORY_LABELS } from '@/lib/schemas/exercise';
import {
  suggestNextWeight,
  SORENESS_HOLD_AT_OR_ABOVE,
  type ReadinessSignal,
  type SuggestionReason,
  type SuggestionResult,
} from '@/lib/progression';
import { formatWeight } from '@/lib/units';
import { formatCardioSet } from '@/lib/cardio';
import type { SerializedLastPerformance } from './session-runner';

// Last-session reference line for a cardio exercise (issue #176): duration and
// distance via the shared cardio formatter, with average heart rate appended
// when the previous session recorded one. Distance and bpm are simply omitted
// when absent, so a duration-only cardio set shows just the duration.
function cardioLastLine(cardio: NonNullable<SerializedLastPerformance['cardio']>): string {
  const base = formatCardioSet(cardio.durationSec, cardio.distanceM);
  return cardio.avgHr != null ? `${base} · 心率 ${cardio.avgHr} bpm` : base;
}

interface Props {
  programExercise: ProgramExercise & { exercise: Exercise };
  lastPerformance: SerializedLastPerformance | undefined;
  readiness: ReadinessSignal | null;
  // True while a planned deload week is active (issue #112).
  deloadActive: boolean;
  unit: WeightUnit;
}

// Short, plain-language explainer shown next to the suggested load when a
// planned deload week or a recent readiness/soreness check-in made the
// suggestion more conservative. Returns null for the normal reasons so the UI
// is unchanged then. The note names the likelier cause - the planned deload,
// reported soreness for the trained muscle, or low overall readiness - so the
// adjustment reads as deliberate, not arbitrary.
function readinessExplainer(
  reason: SuggestionReason,
  readiness: ReadinessSignal | null,
  muscleGroup: MuscleGroup,
): string | null {
  if (reason === 'planned-deload') return '减轻 - 计划减载周';
  if (reason !== 'readiness-hold' && reason !== 'readiness-deload') return null;
  const verb = reason === 'readiness-deload' ? '减轻' : '维持';
  const groupSoreness = readiness?.soreness?.[muscleGroup];
  const cause =
    typeof groupSoreness === 'number' && groupSoreness >= SORENESS_HOLD_AT_OR_ABOVE
      ? '肌肉酸痛'
      : '准备度不足';
  return `${verb} - ${cause}`;
}

// Long-form explanation behind the help (?) toggle, per suggestion reason.
function helpText(suggestion: SuggestionResult, unit: WeightUnit): string {
  const working = formatWeight(suggestion.workingWeight ?? 0, unit, { decimals: 2, group: false });
  switch (suggestion.reason) {
    case 'progression':
      return `所有正式组在 ${working} 下完成了 ${suggestion.targetRepsMax} 次，负荷增加 ${formatWeight(suggestion.delta ?? 0, unit, { decimals: 2, group: false })} 回到次数范围下限（双重渐进法）。`;
    case 'readiness-hold':
      return `最近训练准备度检查显示恢复不足，今天维持 ${working} 不加重量，专注于推次数而不是加重量。`;
    case 'readiness-deload':
      return `最近训练准备度检查显示恢复很差，负荷从 ${working} 下调进行轻训，随恢复会逐步回升。`;
    case 'planned-deload':
      return `当前在计划减载周，负荷下调约 10% 至 ${working}。减载结束后恢复正常渐进（可在进度页提前结束减载）。`;
    default:
      return `维持当前负荷，争取突破次数。当所有正式组都能完成 ${suggestion.targetRepsMax} 次时，会自动触发渐进增加负荷。`;
  }
}

export function ExerciseCard({
  programExercise,
  lastPerformance,
  readiness,
  deloadActive,
  unit,
}: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const exo = programExercise.exercise;
  // Cardio exercises (issue #133) are duration/distance based: the weight x
  // reps targets, load suggestion and last-performance load make no sense for
  // them, so those blocks are hidden.
  const isCardio = exo.category === 'CARDIO';

  const repsLabel =
    programExercise.targetRepsMin === programExercise.targetRepsMax
      ? `${programExercise.targetRepsMin}`
      : `${programExercise.targetRepsMin}-${programExercise.targetRepsMax}`;

  const suggestion = suggestNextWeight(
    programExercise,
    lastPerformance?.sets ?? [],
    readiness,
    deloadActive,
  );
  const readinessNote = readinessExplainer(suggestion.reason, readiness, exo.muscleGroup);
  const lastDate = lastPerformance
    ? new Intl.DateTimeFormat('zh-CN', { day: '2-digit', month: '2-digit' }).format(
        new Date(lastPerformance.sessionStartedAt),
      )
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-bold tracking-tight">{exo.name}</h2>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{MUSCLE_GROUP_LABELS[exo.muscleGroup]}</Badge>
          <Badge variant="outline">{CATEGORY_LABELS[exo.category]}</Badge>
        </div>
        {/* Exercise cue (issue #224): when the exercise carries a technique
            note, surface it as an always-visible muted line right under the
            header so the form reminder is there exactly while logging the set.
            This is the exercise's own notes; the per-set quick-note field and
            the collapsible program-notes block below are unchanged. */}
        {exo.notes && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-pre-line">{exo.notes}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-sm font-medium">
          {isCardio ? (
            <>
              {programExercise.targetSets} 组 · 休息 {programExercise.restSec}秒
            </>
          ) : (
            <>
              {programExercise.targetSets}组 × {repsLabel}次 · RIR{' '}
              {programExercise.targetRIR} · 休息 {programExercise.restSec}秒
              {programExercise.tempo && ` · 节奏 ${programExercise.tempo}`}
            </>
          )}
        </p>

        {lastPerformance && (!isCardio || lastPerformance.cardio) && (
          <div className="rounded-md bg-secondary/50 p-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">上次 ({lastDate})</span>
            </div>
            <p className="font-medium">
              {isCardio && lastPerformance.cardio
                ? cardioLastLine(lastPerformance.cardio)
                : lastPerformance.maxWeight === 0
                  ? `${lastPerformance.repsAtMaxWeight}次 自重`
                  : `${formatWeight(lastPerformance.maxWeight, unit, { decimals: 2, group: false })} × ${lastPerformance.repsAtMaxWeight} reps`}
            </p>
          </div>
        )}

        {!isCardio && suggestion.weight != null && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="flex items-center gap-2">
              {suggestion.reason === 'progression' ? (
                <TrendingUp className="size-4 text-primary" />
              ) : (
                <Lightbulb className="size-4 text-primary" />
              )}
              <span className="flex-1">
                建议：{' '}
                <span className="font-medium">
                  {suggestion.weight === 0
                    ? '自重'
                    : formatWeight(suggestion.weight, unit, { decimals: 2, group: false })}
                </span>
                {suggestion.reason === 'progression' && suggestion.delta && (
                  <span className="ml-1 text-xs text-primary">
                    (+{formatWeight(suggestion.delta, unit, { decimals: 2, group: false })})
                  </span>
                )}
                {readinessNote && (
                  <Badge variant="secondary" className="ml-2 align-middle">
                    {readinessNote}
                  </Badge>
                )}
              </span>
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                aria-label="建议依据"
                aria-expanded={helpOpen}
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="size-4" />
              </button>
            </div>
            {helpOpen && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {helpText(suggestion, unit)}
              </p>
            )}
          </div>
        )}

        {programExercise.notes && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotesOpen((v) => !v)}
              className="-ml-2"
            >
              {notesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              <span className="ml-1">备注</span>
            </Button>
            {notesOpen && (
              <div className="mt-2 space-y-2 rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                {/* The exercise's own notes are the always-visible cue under the
                    header; this block holds only the program-specific note so
                    the same text is never shown twice. */}
                {programExercise.notes && <p className="whitespace-pre-line">{programExercise.notes}</p>}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
