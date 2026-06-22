'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { formatCardioSet } from '@/lib/cardio';
import { FIT_MAX_BATCH } from '@/lib/schemas/import';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Client-side mirror of the server cap (the server re-enforces it).
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// File.text() with a FileReader fallback (jsdom and older browsers).
async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Read a binary file (FIT, issue #249) as base64 so it can ride the JSON import
// payload. Uses arrayBuffer() with a FileReader fallback for jsdom.
async function readFileBase64(file: File): Promise<string> {
  const buf =
    typeof file.arrayBuffer === 'function'
      ? await file.arrayBuffer()
      : await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
  const b = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < b.length; i++) binary += String.fromCharCode(b[i]!);
  return btoa(binary);
}

interface LineError {
  line: number;
  reason: string;
}

interface Preview {
  sessions: number;
  sets: number;
  newExercises: string[];
  existingSessionDates: string[];
  duplicatesSkipped: number;
  // Cardio sets to import (issue #134) vs rows that still cannot be
  // represented (no usable duration) and are skipped with a notice.
  cardioSets: number;
  cardioSkipped: number;
  errorCount: number;
  errors: LineError[];
}

// TCX preview/confirm payload (issue #152): one activity = one session, so
// the shape is a single summary instead of the CSV counts.
interface TcxPreview {
  sport: string;
  exerciseName: string;
  startedAt: string;
  durationSec: number;
  distanceM: number | null;
  avgHr: number | null;
  maxHr: number | null;
  duplicateSessions: string[];
}

// FIT batch preview (issue #253): one entry per uploaded file. A file that
// failed to parse comes back ok:false with an error instead of a summary.
interface FitBatchActivity extends Partial<TcxPreview> {
  index: number;
  ok: boolean;
  error?: string;
}
interface FitBatchPreview {
  activities: FitBatchActivity[];
  importable: number;
  skipped: number;
}

type ImportFormat = 'STRONG' | 'HEVY' | 'TCX' | 'GPX' | 'FIT';

// Copy and endpoint per supported source app. Strong keeps its unit toggle
// (its export follows the app's unit setting); Hevy always exports kg, so the
// toggle is hidden for it. TCX (issue #152) and GPX (issue #204) are both
// single-activity cardio files - they share the preview/confirm UI.
const FORMAT_META: Record<
  ImportFormat,
  {
    label: string;
    endpoint: string;
    exportHint: string;
    hasUnitToggle: boolean;
    accept: string;
    fileKind: string;
  }
> = {
  STRONG: {
    label: 'Strong',
    endpoint: '/api/import/strong',
    exportHint: 'export it as CSV (Settings, then Export data)',
    hasUnitToggle: true,
    accept: '.csv,text/csv',
    fileKind: 'CSV',
  },
  HEVY: {
    label: 'Hevy',
    endpoint: '/api/import/hevy',
    exportHint: 'export it as CSV (Settings, then Export & Import Data)',
    hasUnitToggle: false,
    accept: '.csv,text/csv',
    fileKind: 'CSV',
  },
  TCX: {
    label: 'TCX file',
    endpoint: '/api/import/tcx',
    exportHint:
      'export the activity as TCX from your watch platform (Garmin Connect, Polar Flow, ...) and it becomes one cardio session with duration, distance and heart rate',
    hasUnitToggle: false,
    accept: '.tcx,application/vnd.garmin.tcx+xml,application/xml,text/xml',
    fileKind: 'TCX',
  },
  GPX: {
    label: 'GPX file',
    endpoint: '/api/import/gpx',
    exportHint:
      'export the route as GPX from Strava, Komoot or Apple Fitness and it becomes one cardio session with duration, distance and heart rate',
    hasUnitToggle: false,
    accept: '.gpx,application/gpx+xml,application/xml,text/xml',
    fileKind: 'GPX',
  },
  FIT: {
    label: 'FIT file',
    endpoint: '/api/import/fit',
    exportHint:
      'export the activity as a FIT file from your Garmin (or other) watch and it becomes one cardio session with duration, distance and heart rate',
    hasUnitToggle: false,
    accept: '.fit,application/vnd.ant.fit,application/octet-stream',
    fileKind: 'FIT',
  },
};

// CSV import from another tracker (issues #100/#113): pick the source app and
// the export file, dry-run preview (counts + per-line errors, nothing
// written), then explicitly confirm.
export function ImportSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<ImportFormat>('STRONG');
  const [unit, setUnit] = useState<'KG' | 'LB'>('KG');
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [tcxPreview, setTcxPreview] = useState<TcxPreview | null>(null);
  // FIT supports a multi-file batch (issue #253): the base64 payloads and the
  // aggregated per-file preview live here, separate from the single-file states.
  const [fitPayloads, setFitPayloads] = useState<string[] | null>(null);
  const [fitBatch, setFitBatch] = useState<FitBatchPreview | null>(null);
  const [busy, setBusy] = useState(false);

  const meta = FORMAT_META[format];
  const isTcx = format === 'TCX';
  const isGpx = format === 'GPX';
  const isFit = format === 'FIT';
  // TCX, GPX and FIT are all single-activity cardio imports: same summary
  // shape, same preview/confirm UI. FIT is the only binary one (read as base64).
  const isCardioActivity = isTcx || isGpx || isFit;

  function pickFile() {
    fileRef.current?.click();
  }

  function resetPreviews() {
    setCsvText(null);
    setFileName(null);
    setPreview(null);
    setTcxPreview(null);
    setFitPayloads(null);
    setFitBatch(null);
  }

  function switchFormat(next: ImportFormat) {
    if (busy) return;
    setFormat(next);
    // A pending preview was produced by the other parser; drop it.
    resetPreviews();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.some((f) => f.size > MAX_FILE_BYTES)) {
      toast.error('文件过大：每个限制为5 MB。');
      return;
    }

    // FIT (issue #253) is binary AND supports a multi-file batch.
    if (isFit) {
      if (files.length > FIT_MAX_BATCH) {
        toast.error(`一次最多 ${FIT_MAX_BATCH} 个 FIT 文件。`);
        return;
      }
      const payloads = await Promise.all(files.map(readFileBase64));
      setFileName(files.map((f) => f.name).join(', '));
      setFitPayloads(payloads);
      setPreview(null);
      setTcxPreview(null);
      await requestFitPreview(payloads);
      return;
    }

    // Every other format is single-file text.
    const file = files[0]!;
    const text = await readFileText(file);
    setFileName(file.name);
    setCsvText(text);
    setPreview(null);
    setTcxPreview(null);
    await requestPreview(text);
  }

  async function callFitBatch(payloads: string[], mode: 'preview' | 'confirm') {
    const res = await fetch('/api/import/fit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fits: payloads, mode }),
    });
    const json = (await res.json().catch(() => null)) as
      | (FitBatchPreview & {
          createdSessions?: number;
          createdSets?: number;
          createdExercises?: number;
          skipped?: number;
          error?: string;
        })
      | null;
    if (!res.ok) throw new Error(json?.error ?? `Error ${res.status}`);
    return json;
  }

  async function requestFitPreview(payloads: string[]) {
    setBusy(true);
    try {
      const json = await callFitBatch(payloads, 'preview');
      if (json) setFitBatch(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '预览失败。');
      setFitPayloads(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmFitBatch() {
    if (!fitPayloads) return;
    setBusy(true);
    try {
      const json = await callFitBatch(fitPayloads, 'confirm');
      const sessions = json?.createdSessions ?? 0;
      const newEx = json?.createdExercises ?? 0;
      const skipped = json?.skipped ?? 0;
      toast.success(
        `已导入 ${sessions} 个训练` +
          (newEx > 0 ? `，${newEx} 个新动作` : '') +
          (skipped > 0 ? `（${skipped} 个文件跳过）。` : '。'),
      );
      resetPreviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导入失败。');
    } finally {
      setBusy(false);
    }
  }

  async function callApi(fileText: string, mode: 'preview' | 'confirm') {
    const res = await fetch(meta.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Each route's Zod schema defines its exact body: TCX carries the file as
      // xml, GPX as gpx; the CSV routes as csv (unit only where the app exports
      // both).
      body: JSON.stringify(
        isTcx
          ? { xml: fileText, mode }
          : isGpx
            ? { gpx: fileText, mode }
            : meta.hasUnitToggle
              ? { csv: fileText, unit, mode }
              : { csv: fileText, mode },
      ),
    });
    const json = (await res.json().catch(() => null)) as
      | (Preview &
          TcxPreview & {
            createdSessions?: number;
            createdSets?: number;
            createdExercises?: number;
            error?: string;
          })
      | null;
    if (!res.ok) {
      throw new Error(json?.error ?? `Error ${res.status}`);
    }
    return json;
  }

  async function requestPreview(fileText: string) {
    setBusy(true);
    try {
      const json = await callApi(fileText, 'preview');
      // TCX/GPX are single-activity cardio (FIT has its own batch path).
      if (json && (isTcx || isGpx)) setTcxPreview(json);
      else if (json) setPreview(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '预览失败。');
      setCsvText(null);
      setFileName(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!csvText) return;
    setBusy(true);
    try {
      const json = await callApi(csvText, 'confirm');
      toast.success(
        `已导入 ${json?.createdSessions ?? 0} 个训练、${json?.createdSets ?? 0} 组记录` +
          ((json?.createdExercises ?? 0) > 0
            ? `，创建 ${json?.createdExercises} 个新动作。`
            : '。'),
      );
      setCsvText(null);
      setFileName(null);
      setPreview(null);
      setTcxPreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导入失败。');
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    resetPreviews();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold">
          {isCardioActivity ? `导入 ${meta.fileKind} 活动` : `从 ${meta.label} 导入`}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isCardioActivity
            ? `导入有氧训练：${meta.exportHint}。在此预览，然后确认。`
            : `从 ${meta.label} 应用导入训练历史：${meta.exportHint}，在此预览，然后确认。`}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="import-format">来源应用</Label>
            <Select
              value={format}
              onValueChange={(v) => switchFormat(v as ImportFormat)}
            >
              <SelectTrigger id="import-format" className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRONG">Strong</SelectItem>
                <SelectItem value="HEVY">Hevy</SelectItem>
                <SelectItem value="TCX">TCX file</SelectItem>
                <SelectItem value="GPX">GPX file</SelectItem>
                <SelectItem value="FIT">FIT file</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {meta.hasUnitToggle && (
            <div className="space-y-1">
              <Label htmlFor="strong-unit">Strong重量单位</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as 'KG' | 'LB')}>
                <SelectTrigger id="strong-unit" className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">kg</SelectItem>
                  <SelectItem value="LB">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            onClick={pickFile}
            disabled={busy}
            className="min-h-tap"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileUp className="size-4" />
            )}
            <span className="ml-2">
              {isFit
                ? '选择FIT文件'
                : isCardioActivity
                  ? `选择 ${meta.fileKind} 文件`
                  : `选择 ${meta.label} ${meta.fileKind} 文件`}
            </span>
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={meta.accept}
          // FIT supports importing a batch of activities at once (issue #253).
          multiple={isFit}
          className="hidden"
          onChange={onFilePicked}
        />

        {fitBatch && (
          <div className="rounded-md border p-3 text-sm" data-testid="import-preview">
            <p className="font-medium">
              将导入 {fitBatch.importable} 个活动
              {fitBatch.skipped > 0 ? ` · ${fitBatch.skipped} 个跳过` : ''}
            </p>
            <ul className="mt-2 max-h-64 list-disc space-y-1 overflow-y-auto pl-5">
              {fitBatch.activities.map((a) =>
                a.ok ? (
                  <li key={a.index}>
                    {a.sport} on{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(a.startedAt!))}{' '}
                    · {formatCardioSet(a.durationSec!, a.distanceM ?? null)}
                    {a.avgHr != null ? ` · 平均心率 ${a.avgHr} bpm` : ''}
                    {a.maxHr != null ? ` · 最大心率 ${a.maxHr} bpm` : ''} 记录为 {a.exerciseName}
                    {a.duplicateSessions && a.duplicateSessions.length > 0 ? (
                      <span className="text-amber-700 dark:text-amber-400">
                        {' '}
                        (可能重复)
                      </span>
                    ) : null}
                  </li>
                ) : (
                  <li key={a.index} className="text-amber-700 dark:text-amber-400">
                    文件 {a.index + 1} 跳过：{a.error}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={confirmFitBatch}
                disabled={busy || fitBatch.importable === 0}
                className="min-h-tap"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                <span className={busy ? 'ml-2' : ''}>
                  导入 {fitBatch.importable} 个训练
                </span>
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
                取消
              </Button>
            </div>
          </div>
        )}

        {tcxPreview && (
          <div className="rounded-md border p-3 text-sm" data-testid="import-preview">
            <p className="font-medium">
              预览：<code>{fileName}</code>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                1 个有氧训练（{tcxPreview.sport}）于{' '}
                {new Intl.DateTimeFormat('en-US', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(tcxPreview.startedAt))}
              </li>
              <li>
                {formatCardioSet(tcxPreview.durationSec, tcxPreview.distanceM)}
                {tcxPreview.avgHr != null ? ` · avg HR ${tcxPreview.avgHr} bpm` : ''}
                {tcxPreview.maxHr != null ? ` · max HR ${tcxPreview.maxHr} bpm` : ''}{' '}
                记录为 {tcxPreview.exerciseName}
              </li>
              {tcxPreview.duplicateSessions.length > 0 && (
                <li className="text-amber-700 dark:text-amber-400">
                  可能重复：已有训练的开始时间与此活动相差不到2分钟。
                </li>
              )}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={confirmImport} disabled={busy} className="min-h-tap">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                <span className={busy ? 'ml-2' : ''}>确认导入</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
                取消
              </Button>
            </div>
          </div>
        )}

        {preview && (
          <div className="rounded-md border p-3 text-sm" data-testid="import-preview">
            <p className="font-medium">
              预览：<code>{fileName}</code>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                将导入 {preview.sessions} 个训练、{preview.sets} 组
              </li>
              {preview.newExercises.length > 0 && (
                <li>
                  将创建 {preview.newExercises.length} 个新动作：{' '}
                  {preview.newExercises.join(', ')}
                </li>
              )}
              {preview.duplicatesSkipped > 0 && (
                <li>{preview.duplicatesSkipped} 个完全重复项将被跳过</li>
              )}
              {preview.cardioSets > 0 && (
                <li>
                  {preview.cardioSets} 个有氧组（时长/距离）包含在内
                </li>
              )}
              {preview.cardioSkipped > 0 && (
                <li>
                  {preview.cardioSkipped} 个无有效时长的有氧行将被跳过
                </li>
              )}
              {preview.existingSessionDates.length > 0 && (
                <li className="text-amber-700 dark:text-amber-400">
                  已有训练记录的日期：{' '}
                  {preview.existingSessionDates.join(', ')}
                </li>
              )}
            </ul>

            {preview.errorCount > 0 && (
              <div className="mt-2">
                <p className="font-medium text-rose-600">
                  {preview.errorCount} 行无法读取，将被跳过：
                </p>
                <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-5 text-xs text-muted-foreground">
                  {preview.errors.map((e) => (
                    <li key={`${e.line}-${e.reason}`}>
                      第 {e.line} 行：{e.reason}
                    </li>
                  ))}
                  {preview.errorCount > preview.errors.length && (
                    <li>……以及另外 {preview.errorCount - preview.errors.length} 个</li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={confirmImport}
                disabled={busy || preview.sets === 0}
                className="min-h-tap"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                <span className={busy ? 'ml-2' : ''}>确认导入</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
                取消
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
