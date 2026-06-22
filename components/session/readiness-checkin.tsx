'use client';

import { useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import type { MuscleGroup } from '@/lib/prisma-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { readinessCheckinInputSchema } from '@/lib/schemas/readiness';
import { MUSCLE_GROUP_LABELS } from '@/lib/schemas/exercise';

// Optional, skippable pre-session readiness check-in (issue #38). Adds no
// friction: it is collapsed by default behind a single tap and never blocks
// starting a session. The latest check-in feeds the coach payload as an input
// signal; it does not change anything about how a session is logged.
//
// Soreness (per-muscle-group 1-5) and a free-text note are equally optional
// (issue #48): they live behind a second "Add soreness / note" toggle so the
// quick two-tap readiness + sleep path stays unchanged. Only rated groups are
// submitted, matching the partial-map semantics the schema and coach expect.

const SCALE = [1, 2, 3, 4, 5];

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

export function ReadinessCheckin() {
  const [open, setOpen] = useState(false);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [soreness, setSoreness] = useState<Partial<Record<MuscleGroup, number>>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setSorenessFor(group: MuscleGroup, value: number) {
    setSoreness((prev) => {
      // Tapping the current rating again clears it, so a group can be unrated.
      if (prev[group] === value) {
        const next = { ...prev };
        delete next[group];
        return next;
      }
      return { ...prev, [group]: value };
    });
  }

  async function submit() {
    if (readiness === null || sleepQuality === null) {
      toast.error('请先评价准备度和睡眠质量。');
      return;
    }
    // Only send a soreness map / note when the user actually filled them in, so
    // the quick path stays a clean { readiness, sleepQuality } payload.
    const trimmedNote = note.trim();
    const payload = {
      readiness,
      sleepQuality,
      ...(Object.keys(soreness).length > 0 ? { soreness } : {}),
      ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
    };

    // Validate locally with the same schema the route uses, so a bad note
    // length (etc.) is caught before the round-trip.
    const parsed = readinessCheckinInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? '打卡数据无效。');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      toast.success('打卡已保存。教练会参考此数据。');
      setSaved(true);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '无法保存打卡数据。');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setOpen(true)}
      >
        <HeartPulse className="size-4" />
        <span className="ml-2">
          {saved ? '更新准备度' : '训练准备度（可选）'}
        </span>
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-base font-semibold">你今天恢复得怎么样？</h2>
        <p className="text-xs text-muted-foreground">
          可选。评分 1（低）到 5（高）；AI 教练会参考此数据自动调整训练。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ScaleRow label="整体准备度" value={readiness} onChange={setReadiness} />
        <ScaleRow label="睡眠质量" value={sleepQuality} onChange={setSleepQuality} />

        {!detailsOpen ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setDetailsOpen(true)}
          >
            添加酸痛 / 备注（可选）
          </Button>
        ) : (
          <div className="flex flex-col gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                各肌肉酸痛
              </Label>
              <p className="text-xs text-muted-foreground">
                仅评价感觉酸痛的部位（1 无感，5 很酸）。再次点击可清除评分。
              </p>
              <div className="flex flex-col gap-3">
                {MUSCLE_GROUPS.map((group) => (
                  <SorenessRow
                    key={group}
                    label={MUSCLE_GROUP_LABELS[group]}
                    value={soreness[group] ?? null}
                    onChange={(v) => setSorenessFor(group, v)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="readiness-note"
                className="text-xs uppercase tracking-wide text-muted-foreground"
              >
                备注
              </Label>
              <Textarea
                id="readiness-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="有什么想告诉教练的吗（可选）"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            跳过
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScaleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="grid grid-cols-5 gap-2">
        {SCALE.map((n) => (
          <Button
            key={n}
            type="button"
            variant={value === n ? 'default' : 'outline'}
            onClick={() => onChange(n)}
            className="min-h-tap text-lg font-semibold"
            aria-label={`${label}: ${n}`}
            aria-pressed={value === n}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SorenessRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div className="grid grid-cols-5 gap-1">
        {SCALE.map((n) => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? 'default' : 'outline'}
            onClick={() => onChange(n)}
            className="min-h-tap w-9 px-0 text-sm font-semibold"
            aria-label={`${label} soreness: ${n}`}
            aria-pressed={value === n}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  );
}
