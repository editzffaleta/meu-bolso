import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/80 px-6 backdrop-blur-xl lg:px-10">
        <div className="flex items-center gap-2">
          <Wallet className="size-6 text-emerald-400" />
          <span className="text-base font-black tracking-tight">Meu Bolso</span>
        </div>
        <nav>
          <Link
            href="/join"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(52,211,153,0.10),transparent)]" />
        <div className="relative flex max-w-2xl flex-col items-center gap-6">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
            <Wallet className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-6xl">
            Organize suas finanças
            <br />
            <span className="text-emerald-400">no seu ritmo</span>
          </h1>
          <p className="max-w-lg text-lg text-white/50">
            Controle contas, transações, orçamentos e categorias em um só lugar,
            com clareza sobre para onde vai o seu dinheiro.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-emerald-400 font-bold text-black hover:bg-emerald-300"
            >
              <Link href="/join">Começar agora</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
