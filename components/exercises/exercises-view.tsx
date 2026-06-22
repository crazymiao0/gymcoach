'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import type { Exercise, MuscleGroup } from '@/lib/prisma-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExerciseFormDialog } from '@/components/exercises/exercise-form-dialog';
import { DeleteExerciseButton } from '@/components/exercises/delete-exercise-button';
import { CATEGORY_LABELS, MUSCLE_GROUP_LABELS } from '@/lib/schemas/exercise';

interface ExercisesViewProps {
  exercises: Exercise[];
}

export function ExercisesView({ exercises }: ExercisesViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [query, setQuery] = useState('');

  // Case-insensitive substring match on the exercise name. The query only
  // narrows the already-loaded list (no API call); an empty query shows
  // everything, preserving the original behaviour.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [exercises, query]);

  const grouped = useMemo(() => groupByMuscle(filtered), [filtered]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">动作库</h1>
          <p className="text-sm text-muted-foreground">
            已保存 {exercises.length} 个动作。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="min-h-tap">
          <Plus className="size-4" />
          <span className="ml-2">添加</span>
        </Button>
      </div>

      {exercises.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按名称搜索动作"
            aria-label="按名称搜索动作"
            className="pl-9"
          />
        </div>
      )}

      {exercises.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无动作</CardTitle>
            <CardDescription>
              动作库为空。添加你的第一个动作，以便在方案中使用。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>无匹配动作</CardTitle>
            <CardDescription>
              没有动作名称匹配 &ldquo;{query.trim()}&rdquo;。请尝试其他搜索词。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([group, list]) => (
            <section key={group} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {MUSCLE_GROUP_LABELS[group as MuscleGroup]}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((ex) => (
                  <ExerciseRow key={ex.id} exercise={ex} onEdit={() => setEditing(ex)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ExerciseFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <ExerciseFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        mode="edit"
        exercise={editing ?? undefined}
      />
    </div>
  );
}

function ExerciseRow({ exercise, onEdit }: { exercise: Exercise; onEdit: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{exercise.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="secondary">{CATEGORY_LABELS[exercise.category]}</Badge>
            <span>休息 {exercise.defaultRestSec}秒</span>
          </div>
          {exercise.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{exercise.notes}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="编辑"
            className="min-h-tap min-w-tap"
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteExerciseButton exerciseId={exercise.id} exerciseName={exercise.name} />
        </div>
      </CardContent>
    </Card>
  );
}

function groupByMuscle(exercises: Exercise[]): Record<string, Exercise[]> {
  const out: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    if (!out[ex.muscleGroup]) out[ex.muscleGroup] = [];
    out[ex.muscleGroup]!.push(ex);
  }
  return out;
}
