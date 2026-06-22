import Link from 'next/link';
import { Calendar, ChevronRight, History as HistoryIcon } from 'lucide-react';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { applyBodyweight, totalVolume } from '@/lib/stats';
import { formatWeight } from '@/lib/units';
import { HistoryFilters } from '@/components/history/history-filters';

interface SearchParams {
  programId?: string;
  month?: string; // YYYY-MM
}

export default async function HistoryPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await requireSession();

  const hasActiveFilters = Boolean(searchParams.programId || searchParams.month);

  // Filters: program and month (YYYY-MM).
  const programFilter = searchParams.programId
    ? { programId: searchParams.programId }
    : {};

  let dateFilter: { startedAt?: { gte: Date; lt: Date } } = {};
  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    const [yStr, mStr] = searchParams.month.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    dateFilter = {
      startedAt: {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lt: new Date(Date.UTC(y, m, 1)),
      },
    };
  }

  const [sessions, programs, user] = await Promise.all([
    db.session.findMany({
      where: {
        userId: session.userId,
        finishedAt: { not: null },
        ...programFilter,
        ...dateFilter,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        workout: { select: { name: true } },
        program: { select: { name: true } },
        sets: {
          select: {
            weight: true,
            reps: true,
            isWarmup: true,
            durationSec: true,
            exercise: { select: { usesBodyweight: true } },
          },
        },
      },
      take: 100,
    }),
    db.program.findMany({
      where: { userId: session.userId },
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      select: { id: true, name: true },
    }),
    db.user.findUnique({
      where: { id: session.userId },
      select: { bodyweight: true, unit: true },
    }),
  ]);
  const unit = user?.unit ?? 'KG';

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <HistoryIcon className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">历史记录</h1>
        </div>

        <HistoryFilters
          programs={programs}
          selectedProgramId={searchParams.programId}
          selectedMonth={searchParams.month}
        />

        {sessions.length === 0 ? (
          hasActiveFilters ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                没有符合筛选条件的已完成训练。
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={HistoryIcon}
              title="还没有训练记录"
              description="完成你的第一次训练后，这里将显示训练量、组数和时长。"
              action={{ label: '开始第一次训练', href: '/session/new' }}
            />
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => {
              const enrichedSets = applyBodyweight(
                s.sets.map((set) => ({
                  weight: set.weight,
                  reps: set.reps,
                  isWarmup: set.isWarmup,
                  durationSec: set.durationSec,
                  usesBodyweight: set.exercise.usesBodyweight,
                })),
                user?.bodyweight,
              );
              const volume = totalVolume(enrichedSets);
              const workingSets = s.sets.filter((set) => !set.isWarmup).length;
              const durationMin =
                s.finishedAt && s.startedAt
                  ? Math.round((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000)
                  : null;
              return (
                <li key={s.id}>
                  <Link href={`/history/${s.id}`} className="block">
                    <Card className="transition-colors hover:bg-accent/40">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            <span>
                              {new Intl.DateTimeFormat('zh-CN', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              }).format(s.startedAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-base font-medium">
                            {s.workout?.name ?? '自由训练'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                            {s.program && (
                              <Badge variant="secondary">{s.program.name}</Badge>
                            )}
                            <Badge variant="outline">
                              {workingSets} 组
                            </Badge>
                            <Badge variant="outline">
                              {formatWeight(volume, unit, { decimals: 0 })} 训练量
                            </Badge>
                            {durationMin != null && (
                              <Badge variant="outline">{durationMin} 分钟</Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
