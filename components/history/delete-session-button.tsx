'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  sessionId: string;
  workoutName: string | null;
  startedAt: Date;
}

export function DeleteSessionButton({ sessionId, workoutName, startedAt }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const formatted = new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(startedAt);

  async function handleDelete() {
    setPending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      toast.success('训练记录已删除。');
      router.push('/history');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败。');
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
        >
          <Trash2 className="size-4" />
          <span className="ml-1">删除</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除此训练记录？</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{workoutName ?? '自由训练'}</strong>（{formatted}）及其所有组记录将被永久删除。此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={pending}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2">正在删除...</span>
              </>
            ) : (
              '确认删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
