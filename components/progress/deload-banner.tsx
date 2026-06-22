'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BatteryCharging, BatteryLow } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { deloadReasonLine, type DeloadReason } from '@/lib/deload';

interface Props {
  reasons: DeloadReason[];
  // End of the active planned deload week (ISO string), or null when none is
  // running. The server only passes a future timestamp here.
  deloadUntil: string | null;
}

// Banner shown on the progress page when recommendDeload fires or a planned
// deload week is running (issue #112). One tap starts the deload week (the
// suggestion engine then steps loads down ~10%); while active it shows the end
// date and lets the user end it early.
export function DeloadBanner({ reasons, deloadUntil }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const active = deloadUntil != null;

  if (!active && reasons.length === 0) return null;

  async function startDeload() {
    setBusy(true);
    try {
      const res = await fetch('/api/deload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? '无法开始减载周。');
        return;
      }
      toast.success('减载周已开始。负荷建议将在7天内逐步降低。');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function endDeload() {
    setBusy(true);
    try {
      const res = await fetch('/api/deload', { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? '无法结束减载。');
        return;
      }
      toast.success('减载已结束。建议已恢复为正常进度。');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    const endDate = new Intl.DateTimeFormat('zh-CN', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(deloadUntil!));
    return (
      <Card className="border-emerald-500/50 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BatteryCharging className="size-4 text-emerald-600" />
            <h2 className="text-base font-semibold">减载周进行中</h2>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            截至{endDate}，负荷建议将降低约10%，让你在恢复的同时保持运动。之后自动恢复为正常进度。
          </p>
          <div>
            <Button variant="outline" size="sm" onClick={endDeload} disabled={busy}>
              立即结束减载
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BatteryLow className="size-4 text-amber-600" />
          <h2 className="text-base font-semibold">
            建议进行减载周
          </h2>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <ul className="list-disc space-y-1 pl-5">
          {reasons.map((reason) => (
            <li key={reason.kind}>{deloadReasonLine(reason)}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          累积的疲劳可能掩盖进度。开始减载周后，负荷建议将在7天内降低约10%，之后恢复为正常进度。你可以随时提前结束减载；程序中的其他内容保持不变。
        </p>
        <div>
          <Button size="sm" onClick={startDeload} disabled={busy}>
            开始减载周
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
