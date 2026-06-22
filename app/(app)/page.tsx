import Link from 'next/link';
import { Dumbbell, Play, AlertCircle, Lightbulb } from 'lucide-react';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAY_LABELS } from '@/lib/schemas/workout';
import { getHomeInsight } from '@/lib/home-insight';

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
      workouts: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { exercises: true } } },
      },
    },
  });

  // Proactive coach insight (issue #237): the single highest-priority
  // deterministic signal (recommended deload / stalled lift / fresh PR /
  // on-track), composed from the existing derivations. Display-only, no LLM
  // call; null on a brand-new account with no history.
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
