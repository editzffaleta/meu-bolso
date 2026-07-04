'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth/context/auth.context';
import { DASHBOARD_ROUTE } from '@/shared/navigation/app-navigation.config';

type Mode = 'login' | 'register';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_EMAIL = 'demo@meubolso.app';
const DEMO_PASSWORD = 'demo123456';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
};

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
    return <div aria-busy="true" data-theme="light" style={{ minHeight: '100vh', background: 'var(--bg)' }} />;
  }

  return (
    <div
      data-theme="light"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        color: 'var(--text)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <BrandPanel />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .4s ease' }}>
          <ModeTabs mode={mode} onChange={setMode} />

          {mode === 'register' ? <RegisterForm key="register" /> : <LoginForm key="login" />}
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      style={{
        background: 'var(--primary)',
        color: '#fff',
        padding: '56px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#fff',
            color: 'var(--primary)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: 22,
            fontFamily: 'Inter',
          }}
        >
          m
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>meu-bolso</span>
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 420 }}>
        <h1
          style={{
            fontSize: 40,
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-.03em',
            marginBottom: 18,
          }}
        >
          Suas finanças, finalmente sob controle.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.85)' }}>
          Acompanhe receitas e despesas, importe extratos, defina orçamentos e veja para onde
          seu dinheiro está indo — tudo em um só lugar.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
          <div
            style={{
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 14,
              padding: '16px 18px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700 }}>CSV · OFX</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Importe seus extratos</div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.18)',
              borderRadius: 14,
              padding: '16px 18px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700 }}>Automático</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Categorização por regras</div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
        Projeto de portfólio · design & front-end
      </div>

      <div
        style={{
          position: 'absolute',
          right: -90,
          bottom: -90,
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.07)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 60,
          top: -70,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.06)',
        }}
      />
    </div>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        padding: 4,
        borderRadius: 12,
        marginBottom: 28,
      }}
    >
      <button
        type="button"
        data-testid="join-tab-login"
        onClick={() => onChange('login')}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: mode === 'login' ? 'var(--surface)' : 'transparent',
          color: mode === 'login' ? 'var(--text)' : 'var(--text-dim)',
          boxShadow: mode === 'login' ? 'var(--shadow)' : 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Entrar
      </button>
      <button
        type="button"
        data-testid="join-tab-register"
        onClick={() => onChange('register')}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: mode === 'register' ? 'var(--surface)' : 'transparent',
          color: mode === 'register' ? 'var(--text)' : 'var(--text-dim)',
          boxShadow: mode === 'register' ? 'var(--shadow)' : 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
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
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 6 }}>Criar conta</h2>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 26 }}>
        Comece a organizar suas finanças em poucos minutos.
      </p>

      <form onSubmit={handleSubmit} data-testid="join-form">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }} htmlFor="register-name">
            Nome completo
          </label>
          <input
            id="register-name"
            name="name"
            autoComplete="name"
            data-testid="register-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }} htmlFor="register-email">
            E-mail
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            data-testid="register-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}
            htmlFor="register-password"
          >
            Senha
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            data-testid="register-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          data-testid="join-submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 13,
            borderRadius: 11,
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
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

  async function performLogin(loginEmail: string, loginPassword: string) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    performLogin(email, password);
  }

  function handleDemoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    performLogin(DEMO_EMAIL, DEMO_PASSWORD);
  }

  return (
    <>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 6 }}>Entrar</h2>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 26 }}>Acesse sua conta para continuar.</p>

      <form onSubmit={handleSubmit} data-testid="login-form">
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }} htmlFor="login-email">
            E-mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            data-testid="login-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }} htmlFor="login-password">
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            data-testid="login-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          data-testid="login-submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 13,
            borderRadius: 11,
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '22px 0',
          color: 'var(--text-faint)',
          fontSize: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        ou
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 11,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
        }}
      >
        <Icon name="demography" size={19} color="var(--text-dim)" />
        Entrar com conta de demonstração
      </button>
    </>
  );
}
