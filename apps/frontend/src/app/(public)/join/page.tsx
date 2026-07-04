'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth/context/auth.context';
import { DASHBOARD_ROUTE } from '@/shared/navigation/app-navigation.config';

type Mode = 'login' | 'register';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>('register');
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(DASHBOARD_ROUTE);
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return <div aria-busy="true" className="min-h-screen bg-background" />;
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <ModeTabs mode={mode} onChange={setMode} />

          {mode === 'register' ? (
            <RegisterForm key="register" />
          ) : (
            <LoginForm key="login" />
          )}
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-primary px-14 py-14 text-primary-foreground lg:flex">
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white font-black text-primary">
          m
        </div>
        <span className="text-xl font-bold tracking-tight">meu-bolso</span>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight">
          Suas finanças, finalmente sob controle.
        </h1>
        <p className="text-base leading-relaxed text-primary-foreground/85">
          Acompanhe receitas e despesas, importe extratos, defina orçamentos e veja
          para onde seu dinheiro está indo — tudo em um só lugar.
        </p>
      </div>

      <div className="relative z-10 text-sm text-primary-foreground/70">
        meu-bolso
      </div>

      <div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -top-16 right-16 size-48 rounded-full bg-white/10" />
    </div>
  );
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="mb-7 inline-flex rounded-xl border bg-muted p-1">
      <button
        type="button"
        onClick={() => onChange('login')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          mode === 'login'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={() => onChange('register')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          mode === 'register'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        Criar conta
      </button>
    </div>
  );
}

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.status === 201) {
        toast.success('Conta criada com sucesso!');
        setName('');
        setEmail('');
        setPassword('');
        return;
      }

      let body: ApiErrorResponse | null = null;
      try {
        body = (await response.json()) as ApiErrorResponse;
      } catch {
        body = null;
      }

      const errorCodes = body?.errors?.length ? body.errors : ['INTERNAL_SERVER_ERROR'];
      errorCodes.forEach((code) => toast.error(getMessage(code)));
    } catch {
      toast.error(getMessage('INTERNAL_SERVER_ERROR'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2 className="mb-1.5 text-2xl font-bold tracking-tight">Criar conta</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Comece a organizar suas finanças em poucos minutos.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="register-name">Nome completo</Label>
          <Input
            id="register-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        const data = (await response.json()) as { token: string };
        login(data.token);
        router.push(DASHBOARD_ROUTE);
        return;
      }

      let body: ApiErrorResponse | null = null;
      try {
        body = (await response.json()) as ApiErrorResponse;
      } catch {
        body = null;
      }

      const errorCodes = body?.errors?.length ? body.errors : ['INTERNAL_SERVER_ERROR'];
      errorCodes.forEach((code) => toast.error(getMessage(code)));
    } catch {
      toast.error(getMessage('INTERNAL_SERVER_ERROR'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <h2 className="mb-1.5 text-2xl font-bold tracking-tight">Entrar</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Acesse sua conta para continuar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </>
  );
}
