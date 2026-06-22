'use client';

import { HeartPulse } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WEEKLY_CONDITIONING_TARGET_MIN } from '@/lib/stats';

// One weekly conditioning point, serialized at the Server Component boundary.
export interface ConditioningWeekView {
  weekKey: string; // YYYY-Www
  weekStartIso: string; // Monday 00:00 UTC
  minutes: number;
  distanceKm: number;
  sessions: number;
}

interface Props {
  // Zero-filled window, oldest first (lib/stats weeklyConditioning).
  weeks: ConditioningWeekView[];
}

function weekLabel(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', { day: '2-digit', month: '2-digit' }).format(
    new Date(iso),
  );
}

// Conditioning card (issue #135, display-only): weekly cardio minutes as bars
// against the WHO 150 min/week reference line, with distance and session
// count as secondary labels. The parent hides the card entirely while the
// user has never logged a cardio set.
export function ConditioningCard({ weeks }: Props) {
  const chartData = weeks.map((w) => ({
    ...w,
    label: weekLabel(w.weekStartIso),
  }));
  const current = weeks[weeks.length - 1];
  const totalMinutes = weeks.reduce((acc, w) => acc + w.minutes, 0);
  const totalKm = +weeks.reduce((acc, w) => acc + w.distanceKm, 0).toFixed(2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="size-4 text-primary" />
          <h2 className="text-base font-semibold">有氧训练</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          每周有氧时长对比{WEEKLY_CONDITIONING_TARGET_MIN}分钟/周指南
          （中等强度）。距离和次数显示在提示框中。
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value, name) => {
                  if (name === 'minutes') return [`${value ?? 0} 分钟`, '时长'];
                  return [value ?? '', name];
                }}
                labelFormatter={(label, payload) => {
                  const p = payload?.[0]?.payload as ConditioningWeekView | undefined;
                  if (!p) return label;
                  const extras = [
                    p.distanceKm > 0 ? `${p.distanceKm} 公里` : null,
                    `${p.sessions} 次`,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return `${label}周 · ${extras}`;
                }}
              />
              <ReferenceLine
                y={WEEKLY_CONDITIONING_TARGET_MIN}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                label={{
                  value: `${WEEKLY_CONDITIONING_TARGET_MIN} 分钟`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: 'hsl(var(--primary))',
                }}
              />
              <Bar dataKey="minutes" fill="#10b981" name="minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          本周：{current?.minutes ?? 0} 分钟
          {current && current.distanceKm > 0 ? ` · ${current.distanceKm} 公里` : ''}
          {current ? ` · ${current.sessions} 次` : ''}
          {' · '}
          {weeks.length}周总计：{totalMinutes} 分钟
          {totalKm > 0 ? `，${totalKm} 公里` : ''}。
        </p>
      </CardContent>
    </Card>
  );
}
