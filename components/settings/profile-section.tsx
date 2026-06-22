'use client';

import { useState } from 'react';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Sex, TrainingGoal, WeightUnit } from '@/lib/prisma-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ProfileData {
  displayName: string | null;
  bodyweight: number | null;
  sex: Sex | null;
  heightCm: number | null;
  goal: TrainingGoal | null;
  weeklyFrequency: number | null;
  unit: WeightUnit;
}

interface Props {
  initial: ProfileData;
}

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
  { value: 'OTHER', label: '其他' },
];

const GOAL_OPTIONS: { value: TrainingGoal; label: string }[] = [
  { value: 'HYPERTROPHY', label: '增肌' },
  { value: 'STRENGTH', label: '力量' },
  { value: 'FAT_LOSS', label: '减脂' },
  { value: 'RECOMP', label: '重组' },
  { value: 'GENERAL_FITNESS', label: '综合健身' },
];

const UNIT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'KG', label: '公斤 (kg)' },
  { value: 'LB', label: '磅 (lb)' },
];

function numOrEmpty(n: number | null): string {
  return n != null ? String(n) : '';
}

export function ProfileSection({ initial }: Props) {
  const [displayName, setDisplayName] = useState(initial.displayName ?? '');
  const [bodyweight, setBodyweight] = useState(numOrEmpty(initial.bodyweight));
  const [heightCm, setHeightCm] = useState(numOrEmpty(initial.heightCm));
  const [weeklyFrequency, setWeeklyFrequency] = useState(
    numOrEmpty(initial.weeklyFrequency),
  );
  const [sex, setSex] = useState<Sex | undefined>(initial.sex ?? undefined);
  const [goal, setGoal] = useState<TrainingGoal | undefined>(
    initial.goal ?? undefined,
  );
  const [unit, setUnit] = useState<WeightUnit>(initial.unit);
  const [pending, setPending] = useState(false);

  function rangeOk(value: string, min: number, max: number): boolean {
    if (value === '') return true;
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max;
  }

  const isValid =
    rangeOk(bodyweight, 20, 300) &&
    rangeOk(heightCm, 100, 250) &&
    rangeOk(weeklyFrequency, 1, 14);

  async function save() {
    if (!isValid) {
      toast.error('请修正标红的字段。');
      return;
    }
    setPending(true);
    try {
      const body: Record<string, unknown> = {
        displayName: displayName.trim() === '' ? null : displayName.trim(),
        bodyweight: bodyweight === '' ? null : Number(bodyweight),
        heightCm: heightCm === '' ? null : Number(heightCm),
        weeklyFrequency: weeklyFrequency === '' ? null : Number(weeklyFrequency),
      };
      if (sex) body.sex = sex;
      if (goal) body.goal = goal;
      body.unit = unit;

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      toast.success('个人资料已更新。');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作失败。');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="size-5" />
          <h2 className="text-base font-semibold">个人资料</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          个人资料用于个性化AI教练。体重也用于计算自重动作（引体向上、臂屈伸等）的有效训练量；更改体重将重新计算历史数据。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-sm">
            名称
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你的名称"
            maxLength={80}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bodyweight" className="text-sm">
              体重（公斤）
            </Label>
            <Input
              id="bodyweight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={bodyweight}
              onChange={(e) => setBodyweight(e.target.value)}
              placeholder="例如：75"
            />
            {!rangeOk(bodyweight, 20, 300) && (
              <p className="text-xs text-rose-600">请在 20 到 300 kg 之间。</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="heightCm" className="text-sm">
              身高（厘米）
            </Label>
            <Input
              id="heightCm"
              type="number"
              inputMode="numeric"
              step="1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="例如：178"
            />
            {!rangeOk(heightCm, 100, 250) && (
              <p className="text-xs text-rose-600">请在 100 到 250 cm 之间。</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">性别</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
              <SelectTrigger>
                <SelectValue placeholder="未设置" />
              </SelectTrigger>
              <SelectContent>
                {SEX_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weeklyFrequency" className="text-sm">
              每周训练次数
            </Label>
            <Input
              id="weeklyFrequency"
              type="number"
              inputMode="numeric"
              step="1"
              value={weeklyFrequency}
              onChange={(e) => setWeeklyFrequency(e.target.value)}
              placeholder="例如：3"
            />
            {!rangeOk(weeklyFrequency, 1, 14) && (
              <p className="text-xs text-rose-600">请在 1 到 14 之间。</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">目标</Label>
          <Select value={goal} onValueChange={(v) => setGoal(v as TrainingGoal)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="未设置" />
            </SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">重量单位</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as WeightUnit)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            改变重量的显示和输入方式。你的数据始终以公斤存储，因此切换单位不会改变历史记录。
          </p>
        </div>

        <div>
          <Button
            type="button"
            onClick={save}
            disabled={pending || !isValid}
            className="min-h-tap"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span className="ml-2">保存</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
