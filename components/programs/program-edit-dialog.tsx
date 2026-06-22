'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { Program } from '@/lib/prisma-client';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { programInputSchema, type ProgramInput } from '@/lib/schemas/program';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program;
}

export function ProgramEditDialog({ open, onOpenChange, program }: Props) {
  const router = useRouter();
  const form = useForm<ProgramInput>({
    resolver: zodResolver(programInputSchema),
    defaultValues: {
      name: program.name,
      phase: program.phase ?? undefined,
      description: program.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: program.name,
        phase: program.phase ?? undefined,
        description: program.description ?? '',
      });
    }
  }, [open, program, form]);

  async function onSubmit(values: ProgramInput) {
    const res = await fetch(`/api/programs/${program.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, description: values.description || null }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(data?.error ?? '出错了');
      return;
    }
    toast.success('方案已更新。');
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑方案</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phase">阶段</Label>
            <Input id="phase" {...form.register('phase')} />
            {form.formState.errors.phase && (
              <p className="text-sm text-destructive">{form.formState.errors.phase.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '正在保存...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
