'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CoachContextSummary } from '@/lib/coach-context';

interface Props {
  summary: CoachContextSummary;
}

// "What your coach sees" (issue #154, display-only): a collapsed-by-default
// card that renders the same payload sections the AI debrief receives, so the
// user can verify at a glance that the coach knows their training. The summary
// is derived server-side from buildCoachPayload via summarizeCoachPayload -
// no derivation is duplicated here.
export function CoachContextCard({ summary }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <Eye className="size-4 text-primary" />
          <h2 className="text-base font-semibold">AI教练能看到的信息</h2>
        </button>
        {!open && (
          <p className="pl-6 text-xs text-muted-foreground">
            每次复盘背后的训练背景信息。点击展开。
          </p>
        )}
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-4 text-sm">
          <Section title="训练历史">
            {summary.weeksOfHistory > 0 ? (
              <p>
                近{summary.weeksOfHistory}周的训练历史，涵盖{summary.exercisesTracked}个动作。
              </p>
            ) : (
              <p className="text-muted-foreground">
                尚未记录训练——教练将从你的第一次训练开始学习。
              </p>
            )}
          </Section>

          <Section title="目标">
            {summary.goals.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {summary.goals.map((g) => (
                  <li key={`${g.exerciseName}-${g.targetWeight}-${g.targetReps}`}>
                    {g.exerciseName}: {g.targetWeight} 公斤 x {g.targetReps}{' '}
                    {g.achieved ? (
                      <Badge variant="secondary">已达成</Badge>
                    ) : (
                      <span className="text-muted-foreground">（{g.progressPct}%）</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">尚未设定动作目标。</p>
            )}
          </Section>

          <Section title="疲劳">
            {summary.stalledExercises.length > 0 ? (
              <p>停滞动作：{summary.stalledExercises.join('、')}。</p>
            ) : (
              <p className="text-muted-foreground">未检测到停滞动作。</p>
            )}
            {summary.deloadActive ? (
              <p>减载周正在进行中。</p>
            ) : summary.deloadRecommended ? (
              <p>
                建议减载
                {summary.deloadReasons.length > 0
                  ? `：${summary.deloadReasons.join('；')}`
                  : ''}
                。
              </p>
            ) : (
              <p className="text-muted-foreground">无需减载。</p>
            )}
          </Section>

          <Section title="有氧训练">
            <p>
              本周：{summary.conditioning.currentMinutes} 分钟
              {summary.conditioning.currentKm > 0
                ? ` · ${summary.conditioning.currentKm} 公里`
                : ''}
              {` · ${summary.conditioning.currentSessions} 次`}{' '}
              <span className="text-muted-foreground">
                （目标 {summary.conditioning.weeklyTargetMin} 分钟/周）
              </span>
            </p>
          </Section>

          <Section title="准备度">
            {summary.readiness ? (
              <p>
                最近打卡{' '}
                {summary.readiness.daysAgo === 0
                  ? '今天'
                  : `${summary.readiness.daysAgo} 天前`}
                ：准备度 {summary.readiness.readiness}/5，睡眠{' '}
                {summary.readiness.sleepQuality}/5。
              </p>
            ) : (
              <p className="text-muted-foreground">最近7天无准备度打卡记录。</p>
            )}
          </Section>

          <p className="border-t pt-3 text-xs text-muted-foreground">
            AI收到的只是这样的简短摘要及你近期的逐组训练记录——从不包含你的账户数据或训练历史之外的任何信息。
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
