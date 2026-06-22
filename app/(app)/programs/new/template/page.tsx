import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { requireSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TemplatePicker } from '@/components/programs/template-picker';
import { programTemplates } from '@/lib/programs/templates';

export default async function TemplateProgramPage() {
  await requireSession();

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="self-start">
          <Link href="/programs/new">
            <ChevronLeft className="size-4" />
            <span className="ml-1">返回</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">从模板开始</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            从成熟方案中实例化一个经典训练计划。AI教练会在其范围内提供建议——不会擅自调整你的方案结构。
          </p>
        </div>
        <TemplatePicker templates={programTemplates} />
      </div>
    </main>
  );
}
