import { LoginForm } from '@/components/auth/login-form';
import { Dumbbell } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="size-7" />
        <span className="text-xl font-semibold">力量训练日志</span>
      </div>
      <LoginForm />
    </main>
  );
}
