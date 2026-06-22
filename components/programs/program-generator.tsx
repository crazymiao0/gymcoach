'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GeneratedProgram } from '@/lib/schemas/program-generation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Draft = GeneratedProgram;

export function ProgramGenerator() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/programs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      const j = (await res.json()) as { program: Draft };
      setDraft(j.program);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败。');
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/programs/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      const j = (await res.json()) as { id: string };
      toast.success('方案已创建。');
      router.push(`/programs/${j.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败。');
      setSaving(false);
    }
  }

  function patchProgram(patch: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  function patchWorkout(wi: number, patch: Partial<Draft['workouts'][number]>) {
    setDraft((d) =>
      d
        ? { ...d, workouts: d.workouts.map((w, i) => (i === wi ? { ...w, ...patch } : w)) }
        : d,
    );
  }

  function patchExercise(
    wi: number,
    ei: number,
    patch: Partial<Draft['workouts'][number]['exercises'][number]>,
  ) {
    setDraft((d) => {
      if (!d) return d;
      const workouts = d.workouts.map((w, i) =>
        i !== wi
          ? w
          : { ...w, exercises: w.exercises.map((e, j) => (j === ei ? { ...e, ...patch } : e)) },
      );
      return { ...d, workouts };
    });
  }

  function removeExercise(wi: number, ei: number) {
    setDraft((d) => {
      if (!d) return d;
      const workouts = d.workouts.map((w, i) =>
        i !== wi ? w : { ...w, exercises: w.exercises.filter((_, j) => j !== ei) },
      );
      return { ...d, workouts: workouts.filter((w) => w.exercises.length > 0) };
    });
  }

  function removeWorkout(wi: number) {
    setDraft((d) => (d ? { ...d, workouts: d.workouts.filter((_, i) => i !== wi) } : d));
  }

  const num = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="size-5" />
            <h2 className="text-base font-semibold">AI生成训练方案</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            描述你的目标、日程、经验及任何限制条件。保存前可编辑结果。
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={4}
            placeholder="例如：增肌、每周4次、上下肢分化、肩膀不好所以少做推举类动作。"
          />
          <div>
            <Button
              type="button"
              onClick={generate}
              disabled={generating || goal.trim().length < 10}
              className="min-h-tap"
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="ml-2">生成中（10-30秒）...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span className="ml-2">生成</span>
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </CardContent>
      </Card>

      {draft && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold">审查并编辑</h2>
            <p className="text-xs text-muted-foreground">
              可随意调整，然后创建方案。创建后默认为停用状态。
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">方案名称</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => patchProgram({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">阶段</Label>
                <Input
                  value={draft.phase}
                  onChange={(e) => patchProgram({ phase: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">描述</Label>
              <Textarea
                value={draft.description ?? ''}
                rows={2}
                onChange={(e) => patchProgram({ description: e.target.value })}
              />
            </div>

            {draft.workouts.map((w, wi) => (
              <div key={wi} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center gap-2">
                  <Input
                    value={w.name}
                    onChange={(e) => patchWorkout(wi, { name: e.target.value })}
                    className="font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWorkout(wi)}
                    aria-label="移除训练课"
                  >
                    <Trash2 className="size-4 text-rose-600" />
                  </Button>
                </div>

                <ul className="flex flex-col gap-3">
                  {w.exercises.map((ex, ei) => (
                    <li key={ei} className="rounded-md bg-muted/40 p-2">
                      <div className="mb-2 flex items-center gap-2">
                        <Input
                          value={ex.name}
                          onChange={(e) => patchExercise(wi, ei, { name: e.target.value })}
                          className="h-8 text-sm"
                        />
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {ex.muscleGroup}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(wi, ei)}
                          aria-label="移除动作"
                        >
                          <Trash2 className="size-4 text-rose-600" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <NumField
                          label="组数"
                          value={ex.targetSets}
                          onChange={(v) => patchExercise(wi, ei, { targetSets: num(v) })}
                        />
                        <NumField
                          label="最少次数"
                          value={ex.targetRepsMin}
                          onChange={(v) => patchExercise(wi, ei, { targetRepsMin: num(v) })}
                        />
                        <NumField
                          label="最多次数"
                          value={ex.targetRepsMax}
                          onChange={(v) => patchExercise(wi, ei, { targetRepsMax: num(v) })}
                        />
                        <NumField
                          label="RIR"
                          value={ex.targetRIR}
                          onChange={(v) => patchExercise(wi, ei, { targetRIR: num(v) })}
                        />
                        <NumField
                          label="休息（秒）"
                          value={ex.restSec}
                          onChange={(v) => patchExercise(wi, ei, { restSec: num(v) })}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <Button
                type="button"
                onClick={save}
                disabled={saving || draft.workouts.length === 0}
                className="min-h-tap"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                <span className="ml-2">创建方案</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
