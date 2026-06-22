'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Activity, Moon, Smartphone, Sun, Volume2, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type UserPreferences,
} from '@/lib/preferences';
import { BackupSection } from './backup-section';

export function SettingsClient() {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setHydrated(true);
  }, []);

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      savePreferences(next);
      return next;
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold">外观</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <ThemeChoice
              current={theme}
              value="dark"
              icon={<Moon className="size-4" />}
              label="深色"
              onClick={() => setTheme('dark')}
            />
            <ThemeChoice
              current={theme}
              value="light"
              icon={<Sun className="size-4" />}
              label="浅色"
              onClick={() => setTheme('light')}
            />
            <ThemeChoice
              current={theme}
              value="system"
              icon={<Monitor className="size-4" />}
              label="跟随系统"
              onClick={() => setTheme('system')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold">训练会话</h2>
          <p className="text-xs text-muted-foreground">
            这些偏好仅保存于此设备。
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <PrefRow
            icon={<Smartphone className="size-4" />}
            label="振动"
            description="组记录和计时结束时振动。"
            checked={prefs.vibration}
            onChange={(v) => update('vibration', v)}
            disabled={!hydrated}
          />
          <PrefRow
            icon={<Volume2 className="size-4" />}
            label="计时结束提示音"
            description="休息结束时播放短暂的880 Hz提示音。"
            checked={prefs.restTimerSound}
            onChange={(v) => update('restTimerSound', v)}
            disabled={!hydrated}
          />
          <PrefRow
            icon={<Activity className="size-4" />}
            label="允许准备度/酸痛调整建议重量"
            description="开启时，最近的准备度打卡可以保持或降低建议负荷。关闭时，建议仅跟随计划进度。"
            checked={prefs.readinessAutoRegulation}
            onChange={(v) => update('readinessAutoRegulation', v)}
            disabled={!hydrated}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold">杠铃片计算器</h2>
          <p className="text-xs text-muted-foreground">
            杠铃重量和每侧可用片重，用于训练中的杠铃片计算器。请根据你训练时使用的单位设置数值。
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BarPlatesRow
            unitLabel="kg"
            barWeight={prefs.barWeightKg}
            plates={prefs.platesKg}
            onBarChange={(v) => update('barWeightKg', v)}
            onPlatesChange={(v) => update('platesKg', v)}
            disabled={!hydrated}
          />
          <BarPlatesRow
            unitLabel="lb"
            barWeight={prefs.barWeightLb}
            plates={prefs.platesLb}
            onBarChange={(v) => update('barWeightLb', v)}
            onPlatesChange={(v) => update('platesLb', v)}
            disabled={!hydrated}
          />
        </CardContent>
      </Card>

      <BackupSection />
    </>
  );
}

function BarPlatesRow({
  unitLabel,
  barWeight,
  plates,
  onBarChange,
  onPlatesChange,
  disabled,
}: {
  unitLabel: string;
  barWeight: number;
  plates: number[];
  onBarChange: (v: number) => void;
  onPlatesChange: (v: number[]) => void;
  disabled?: boolean;
}) {
  // Edit plates as comma-separated text; commit a cleaned, descending list on
  // change. Empty / invalid entries are dropped so the calculator stays sane.
  function commitPlates(raw: string) {
    const parsed = raw
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => b - a);
    onPlatesChange(parsed);
  }

  return (
    <div className="rounded-md border border-border/40 p-3">
      <p className="mb-2 text-sm font-medium">器材（{unitLabel}）</p>
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <Label
            htmlFor={`bar-${unitLabel}`}
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            杠铃重量（{unitLabel}）
          </Label>
          <Input
            id={`bar-${unitLabel}`}
            type="number"
            inputMode="decimal"
            step="0.5"
            value={barWeight}
            disabled={disabled}
            onChange={(e) => onBarChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={`plates-${unitLabel}`}
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            单侧杠铃片（{unitLabel}）
          </Label>
          <Input
            id={`plates-${unitLabel}`}
            type="text"
            inputMode="decimal"
            defaultValue={plates.join(', ')}
            disabled={disabled}
            onBlur={(e) => commitPlates(e.target.value)}
            placeholder="例如：25, 20, 15, 10, 5, 2.5, 1.25"
          />
        </div>
      </div>
    </div>
  );
}

function ThemeChoice({
  current,
  value,
  icon,
  label,
  onClick,
}: {
  current: string | undefined;
  value: 'dark' | 'light' | 'system';
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const active = current === value;
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className="min-h-tap"
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}

function PrefRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/40 p-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </label>
  );
}
