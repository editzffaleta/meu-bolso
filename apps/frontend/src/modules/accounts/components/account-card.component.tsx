'use client';

import { Pencil, Trash2, Wallet } from 'lucide-react';
import { accountTypeLabel, type Account } from '@/modules/accounts/types/account.type';

type AccountCardProps = {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const isNegative = account.initialBalance < 0;

  return (
    <div className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/10">
          <Wallet className="size-6 text-primary" />
        </span>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-primary"
            aria-label={`Editar ${account.name}`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Excluir ${account.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 text-base font-bold">{account.name}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {accountTypeLabel(account.type)}
        {account.institution ? ` · ${account.institution}` : ''}
      </div>

      <div className="mt-4 border-t border-border pt-3.5">
        <div className="mb-1 text-[11.5px] text-muted-foreground">Saldo inicial</div>
        <div
          className={`font-mono-money text-xl font-bold ${isNegative ? 'text-destructive' : 'text-foreground'}`}
        >
          {formatCurrency(account.initialBalance)}
        </div>
      </div>
    </div>
  );
}
