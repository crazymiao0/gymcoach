'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Download, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmingFile, setConfirmingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gymcoach-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('导出已完成。');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '导出失败。');
    } finally {
      setExporting(false);
    }
  }

  function pickFile() {
    fileRef.current?.click();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (file) setConfirmingFile(file);
  }

  async function confirmImport() {
    if (!confirmingFile) return;
    setImporting(true);
    try {
      const text = await confirmingFile.text();
      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error('无效的JSON文件。');
      }
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, confirmReplace: true }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Error ${res.status}`);
      }
      toast.success('导入完成。现有数据已被替换。');
      setConfirmingFile(null);
      // Refresh the page to start from a clean state.
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '导入失败。');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold">数据</h2>
        <p className="text-xs text-muted-foreground">
          从JSON文件本地备份或恢复。
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="min-h-tap"
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <span className="ml-2">导出所有数据（JSON）</span>
        </Button>

        <Button
          variant="outline"
          onClick={pickFile}
          disabled={importing}
          className="min-h-tap"
        >
          <Upload className="size-4" />
          <span className="ml-2">导入备份</span>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={onFilePicked}
        />

        {confirmingFile && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-5 shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium">确认导入</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  文件 <code>{confirmingFile.name}</code> 将替换
                  <strong>所有</strong>当前数据（方案、训练记录、组记录、目标、体重历史、打卡记录、教练对话）。此操作无法撤销。
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={confirmImport}
                    disabled={importing}
                    className="min-h-tap"
                  >
                    {importing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span className={importing ? 'ml-2' : ''}>
                      确认替换
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingFile(null)}
                    disabled={importing}
                  >
                    取消
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
