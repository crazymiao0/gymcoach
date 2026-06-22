'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

type FormValues = z.infer<typeof schema>;

// Public demo flag and credentials, inlined at build time. When the flag is on
// (e.g. on a public demo instance) the login page surfaces a one-click sign in.
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
const showDemo = demoMode && demoEmail !== '' && demoPassword !== '';

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function loginAsDemo() {
    // Prefill the fields for visible feedback, then submit the demo credentials.
    setValue('email', demoEmail);
    setValue('password', demoPassword);
    await onSubmit({ email: demoEmail, password: demoPassword });
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      // Use window.location for robust cross-browser redirect (avoids PWA/
      // service-worker issues on mobile where router.replace may silently fail).
      window.location.href = '/';
      return;
    }

    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setServerError(data?.error ?? '登录失败');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>进入你的训练日志</CardDescription>
      </CardHeader>
      <CardContent>
        {showDemo && (
          <div className="mb-4 space-y-2 rounded-md border border-dashed bg-muted/50 p-3">
            <p className="text-sm font-medium">演示账号</p>
            <p className="text-sm text-muted-foreground">
              {demoEmail} / {demoPassword}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="min-h-tap w-full"
              onClick={loginAsDemo}
              disabled={isSubmitting}
            >
              {isSubmitting ? '登录中...' : '演示登录'}
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="min-h-tap w-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? '登录中...' : '登录'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link
              href="/signup"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
