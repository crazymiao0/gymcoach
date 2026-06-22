'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Target } from 'lucide-react';
import type { WeightUnit } from '@/lib/prisma-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { goalProgress, goalTargetE1RM } from '@/lib/goals';
import { formatWeight, fromDisplayWeight, roundWeight, toDisplayWeight, unitLabel } from '@/lib/units';

// One active goal per exercise, as served by the goals API. achievedAt is
// serialized to an ISO string by the Server Component boundary.
export interface GoalView {
  id: string;
  targetWeight: number; // kg (effective load for bodyweight exercises)
  targetReps: number;
  achievedAt: string | null;
}

interface Props {
  exerciseId: string;
  exerciseName: string;
  usesBodyweight: boolean;
  goal: GoalView | null;
  // Best e1RM ever logged for this exercise (kg, bodyweight-adjusted).
  bestE1RM: number;
  unit: WeightUnit;
}

export function ExerciseGoalCard({
  exerciseId,
  exerciseName,
  usesBodyweight,
  goal,
  bestE1RM,
  unit,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Dialog fields, kept in the display unit like every weight input.
  const [weightField, setWeightField] = useState('');
  const [repsField, setRepsField] = useState('');

  const target = goal
    ? { targetWeight: goal.targetWeight, targetReps: goal.targetReps }
    : null;
  const progress = target ? goalProgress(bestE1RM, target) : 0;
  const achieved = goal?.achievedAt != null;

  function openDialog() {
    setWeightField(
      goal ? String(roundWeight(toDisplayWeight(goal.targetWeight, unit), 1)) : '',
    );
    setRepsField(goal ? String(goal.targetReps) : '');
    setOpen(true);
  }

  async function saveGoal() {
    const weight = parseFloat(weightField);
    const reps = parseInt(repsField, 10);
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isInteger(reps) || reps < 1) {
      toast.error('请输入正数目标重量和至少1次。');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          targetWeight: fromDisplayWeight(weight, unit),
          targetReps: reps,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? '无法保存目标。');
        return;
      }
      toast.success('目标已保存。');
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeGoal() {
    if (!goal) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? '无法删除目标。');
        return;
      }
      toast.success('目标已删除。');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Target className="size-4" />
            目标 - {exerciseName}
          </h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openDialog}>
              {goal ? '编辑目标' : '设定目标'}
            </Button>
            {goal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeGoal}
                disabled={busy}
              >
                删除
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!goal || !target ? (
          <p className="text-sm text-muted-foreground">
            尚未为此动作设定目标。设定目标负荷和次数以追踪进度。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                目标：{formatWeight(goal.targetWeight, unit)} x {goal.targetReps}{' '}
                次
              </span>
              {achieved && (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                  已达成
                </Badge>
              )}
            </div>
            <Progress
              value={Math.round(progress * 100)}
              aria-label="目标进度"
            />
            <p className="text-xs text-muted-foreground">
              预估1RM已达目标的{Math.round(progress * 100)}%
              （最佳{formatWeight(bestE1RM, unit)} vs{' '}
              目标{formatWeight(goalTargetE1RM(target), unit)}）。
            </p>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {goal ? '编辑目标' : '设定目标'} - {exerciseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal-weight">目标负荷 ({unitLabel(unit)})</Label>
              <Input
                id="goal-weight"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={weightField}
                onChange={(e) => setWeightField(e.target.value)}
              />
              {usesBodyweight && (
                <p className="text-xs text-muted-foreground">
                  自重动作：输入总有效负荷（体重 + 附加负重），与进度图表一致。
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-reps">目标次数</Label>
              <Input
                id="goal-reps"
                type="number"
                inputMode="numeric"
                min="1"
                value={repsField}
                onChange={(e) => setRepsField(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={saveGoal} disabled={busy}>
              {busy ? '保存中...' : '保存目标'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
