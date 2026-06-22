'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { programInputSchema, type ProgramInput } from '@/lib/schemas/program';

export function ProgramCreateForm() {
  const router = useRouter();
  const form = useForm<ProgramInput>({
    resolver: zodResolver(programInputSchema),
    defaultValues: { name: '', phase: 'Hypertrophy', description: '' },
  });

  async function onSubmit(values: ProgramInput) {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, description: values.description || null }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? '出错了');
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success('方案已创建。');
    router.push(`/programs/${created.id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">方案名称</Label>
            <Input
              id="name"
              placeholder="例如：增肌2026 - 第一阶段"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">阶段</Label>
            <Input
              id="phase"
              placeholder="例如：增肌、力量、代谢压力"
              {...form.register('phase')}
            />
            {form.formState.errors.phase && (
              <p className="text-sm text-destructive">{form.formState.errors.phase.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="min-h-tap" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '正在创建...' : '创建方案'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
