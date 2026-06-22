import Link from 'next/link';
import { Dumbbell, Play, AlertCircle, Lightbulb, Target } from 'lucide-react';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAY_LABELS } from '@/lib/schemas/workout';
import { getHomeInsight } from '@/lib/home-insight';

// Phase labels in Chinese
const PHASE_LABELS: Record<string, string> = {
  HYPERTROPHY_1: '增肌周1',
  HYPERTROPHY_2: '增肌周2',
  LIGHT: '轻训周',
  STRENGTH: '增力周',
  DELOAD: '减载周',
};

// Role labels in Chinese
const ROLE_LABELS: Record<string, string> = {
  PRIMARY_COMPOUND: '主项复合',
  SECONDARY_COMPOUND: '次项复合',
  ISOLATION: '孤立辅助',
};

export default async function DashboardPage() {
  const session = await requireSession();

  // Look for an unfinished session to offer resuming it.
  const inProgressSession = await db.session.findFirst({
    where: { userId: session.userId, finishedAt: null },
    orderBy: { startedAt: 'desc' },
    include: { workout: { select: { name: true } } },
  });

  const activeProgram = await db.program.findFirst({
    where: { userId: session.userId, isActive: true },
    include: {
      cyclePhase: {
        include: {
          prescriptions: true,
        },
      },
      workouts: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { exercises: true } },
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });

  // Find the next workout to recommend today
  const todaySessions = await db.session.findMany({
    where: { userId: session.userId, finishedAt: { not: null } },
    orderBy: { finishedAt: 'desc' },
    take: 1,
    include: { workout: true },
  });

  // Determine which workout to do today based on PPL rotation
  const lastWorkoutName = todaySessions[0]?.workout?.name ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let todayWorkout: any = activeProgram?.workouts[0] ?? null;
  if (activeProgram && activeProgram.workouts.length > 1 && lastWorkoutName) {
    const lastIdx = activeProgram.workouts.findIndex((w) => w.name === lastWorkoutName);
    if (lastIdx >= 0) {
      const nextIdx = (lastIdx + 1) % activeProgram.workouts.length;
      todayWorkout = activeProgram.workouts[nextIdx];
    }
  }

  // Build prescription map for quick lookup
  const phasePrescriptions = new Map<string, { repMin: number; repMax: number; rpeMin: number; rpeMax: number }>();
  if (activeProgram?.cyclePhase) {
    for (const p of activeProgram.cyclePhase.prescriptions) {
      phasePrescriptions.set(p.exerciseRole, {
        repMin: p.targetRepMin,
        repMax: p.targetRepMax,
        rpeMin: p.targetRpeMin,
        rpeMax: p.targetRpeMax,
      });
    }
  }

  const getPrescription = (role: string | null) => {
    const key = role || 'PRIMARY_COMPOUND';
    return phasePrescriptions.get(key) ?? phasePrescriptions.get('PRIMARY_COMPOUND') ?? null;
  };

  // Rest day detection based on 练二休一练一休一 pattern
  let isRestDay = false;
  let todayCyclePhase = '';
  if (activeProgram?.cyclePhase) {
    todayCyclePhase = PHASE_LABELS[activeProgram.cyclePhase.phaseType] || activeProgram.cyclePhase.name;
  }
  if (activeProgram) {
    const recentSessions = await db.session.findMany({
      where: { userId: session.userId, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
    const today = new Date();
    const getDateStr = (d: Date) => d.toDateString();
    const yesterdayStr = getDateStr(new Date(today.getTime() - 86400000));
    const dayBeforeStr = getDateStr(new Date(today.getTime() - 172800000));
    const day3AgoStr = getDateStr(new Date(today.getTime() - 259200000));
    const hadSessionYesterday = recentSessions.some(
      (s) => getDateStr(s.startedAt) === yesterdayStr
    );
    const hadSessionDayBefore = recentSessions.some((s) => getDateStr(s.startedAt) === dayBeforeStr);
    const had3Ago = recentSessions.some((s) => getDateStr(s.startedAt) === day3AgoStr);
    if (hadSessionYesterday && hadSessionDayBefore) isRestDay = true;
    else if (hadSessionYesterday && !hadSessionDayBefore) isRestDay = !had3Ago;
    else isRestDay = false;
  }

  // Proactive coach insight
  const insight = await getHomeInsight(session.userId);

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Dumbbell className="size-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">力量训练日志</h1>
            <p className="text-xs text-muted-foreground">{session.email}</p>
          </div>
        </div>

        {insight && (
          <Link href={insight.href} className="block">
            <Card className="border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="size-4 text-primary" />
                  {insight.title}
                </CardTitle>
                <CardDescription>{insight.detail}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        {/* Today's Training / Rest Day Card */}
        {activeProgram && activeProgram.cyclePhase && (
          isRestDay ? (
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <span className="text-lg">😌</span>
                  </div>
                  <div>
                    <CardTitle className="text-base">休息日</CardTitle>
                    <CardDescription>今日是恢复日，让肌肉充分生长</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  建议：ZONE2 骑行 20-30 分钟，保持活跃恢复
                </p>
              </CardContent>
            </Card>
          ) : activeProgram && todayWorkout && (
            <Card className="border-primary/20 glow-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="size-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">今日训练</CardTitle>
                      <CardDescription>
                        {activeProgram.cyclePhase.name} · {todayWorkout.name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {todayCyclePhase}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayWorkout.exercises.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
todayWorkout.exercises.map((pe: any) => {
                      const presc = getPrescription(pe.role);
                      return (
                        <div key={pe.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{pe.exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ROLE_LABELS[pe.role ?? 'PRIMARY_COMPOUND'] || '主项复合'}
                            </p>
                          </div>
                          <div className="ml-4 shrink-0 text-right text-xs text-muted-foreground">
                            {presc ? (
                              <span>
                                {pe.targetSets}组 × {presc.repMin}-{presc.repMax}次 · RPE {presc.rpeMin}-{presc.rpeMax}
                              </span>
                            ) : (
                              <span>{pe.targetSets}组 × {pe.targetRepsMin}-{pe.targetRepsMax}次</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">此训练尚未配置动作</p>
                  )}
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/session/new?workoutId=${todayWorkout.id}`}>
                    <Play className="size-4" />
                    <span>开始训练</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {inProgressSession ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">进行中的训练</CardTitle>
              <CardDescription>
                {inProgressSession.workout?.name ?? '训练'} 开始于{' '}
                {new Intl.DateTimeFormat('zh-CN', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(inProgressSession.startedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="min-h-tap w-full text-base">
                <Link href={`/session/${inProgressSession.id}`}>继续训练</Link>
              </Button>
            </CardContent>
          </Card>
        ) : !activeProgram ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">无活跃计划</CardTitle>
              <CardDescription>
                请激活一个训练计划来开始训练
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/programs">查看计划</Link>
              </Button>
            </CardContent>
          </Card>
        ) : activeProgram.workouts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">空计划</CardTitle>
              <CardDescription>
                {activeProgram.name} 还没有配置训练
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/programs/${activeProgram.id}`}>配置计划</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">开始训练</CardTitle>
                <CardDescription>
                  当前计划：{activeProgram.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="min-h-tap w-full text-base">
                  <Link href="/session/new">
                    <Play className="size-5" />
                    <span className="ml-2">选择训练</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                计划训练
              </h2>
              <ul className="flex flex-col gap-2">
                {activeProgram.workouts.map((w) => {
                  const day = w.dayOfWeek != null ? DAY_LABELS[w.dayOfWeek - 1] : null;
                  const empty = w._count.exercises === 0;
                  return (
                    <li key={w.id}>
                      <Card>
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{w.name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              {day && <Badge variant="secondary">{day}</Badge>}
                              <span>
                                {w._count.exercises} 个动作
                              </span>
                              {empty && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <AlertCircle className="size-3" />
                                  空
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
