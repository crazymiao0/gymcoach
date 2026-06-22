'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MessageSquarePlus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { COACH_NOTE_MAX_LEN } from '@/lib/schemas/profile';

interface Props {
  initialNote: string | null;
}

// "Note to your coach" (issue #188): a short free-text note the user writes to
// the AI coach as their own current context (injuries, illness, life
// constraints). It is part of "what your coach sees" - correctable AI memory.
// Saves through PATCH /api/profile (ownership-scoped, Zod-bounded server-side).
export function CoachNoteCard({ initialNote }: Props) {
  const [note, setNote] = useState(initialNote ?? '');
  const [saved, setSaved] = useState(initialNote ?? '');
  const [busy, setBusy] = useState(false);

  const trimmed = note.trim();
  const dirty = trimmed !== saved.trim();
  const overLimit = note.length > COACH_NOTE_MAX_LEN;

  async function persist(value: string | null) {
    setBusy(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachNote: value }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? '无法保存备注。');
        return false;
      }
      return true;
    } catch {
      toast.error('无法保存备注。');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (overLimit) return;
    // Empty after trim is a clear; the server coerces "" to null all the same.
    const value = trimmed.length > 0 ? trimmed : null;
    if (await persist(value)) {
      setNote(value ?? '');
      setSaved(value ?? '');
      toast.success(value ? '备注已保存。' : '备注已清除。');
    }
  }

  async function handleClear() {
    if (await persist(null)) {
      setNote('');
      setSaved('');
      toast.success('备注已清除。');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="size-4 text-primary" />
          <h2 className="text-base font-semibold">给AI教练的备注</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          你目前的个人状况，让教练考虑到——受伤、生病、旅行等数据无法体现的事情。教练会结合你的训练历史阅读此备注。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          aria-label="给AI教练的备注"
          placeholder="例如：肩膀不太舒服，这周少做推举类动作。"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={COACH_NOTE_MAX_LEN}
        />
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs tabular-nums ${
              overLimit ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {note.length}/{COACH_NOTE_MAX_LEN}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={busy || (saved.trim().length === 0 && trimmed.length === 0)}
            >
              清除
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={busy || overLimit || !dirty}
            >
              保存
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
