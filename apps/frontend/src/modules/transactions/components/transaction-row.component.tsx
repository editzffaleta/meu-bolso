'use client';

import { Pencil, Trash2, Upload, PenLine } from 'lucide-react';
import { LucideIconByKey } from '@/shared/components/ui/lucide-icon-by-key';
import { TableCell, TableRow } from '@/shared/components/ui/table';
import type { Account } from '@/modules/accounts/types/account.type';
import type { Category } from '@/modules/categories/types/category.type';
import type { Transaction } from '@/modules/transactions/types/transaction.type';
import { formatCurrencyBRL, formatDateBR } from '@/modules/transactions/util/format-currency.util';

type TransactionRowProps = {
  transaction: Transaction;
  account: Account | undefined;
  category: Category | undefined;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function hexToSoftBackground(hex: string): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return 'rgba(148, 163, 184, 0.15)';
  }

  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

export function TransactionRow({ transaction, account, category, onEdit, onDelete }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const signedValue = `${isIncome ? '+' : '-'} ${formatCurrencyBRL(transaction.amount)}`;
  const isManual = transaction.source === 'manual';

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-mono-money text-sm text-muted-foreground">
        {formatDateBR(transaction.date)}
      </TableCell>

      <TableCell className="min-w-0">
        <span className="truncate text-sm font-semibold">{transaction.description}</span>
      </TableCell>

      <TableCell>
        {category ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ backgroundColor: hexToSoftBackground(category.color), color: category.color }}
          >
            <LucideIconByKey name={category.icon} size={13} iconColor={category.color} />
            {category.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Sem categoria</span>
        )}
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">{account?.name ?? '—'}</TableCell>

      <TableCell>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold ${
            isManual ? 'bg-sky-500/10 text-sky-500' : 'bg-violet-500/10 text-violet-500'
          }`}
        >
          {isManual ? <PenLine className="size-3.5" /> : <Upload className="size-3.5" />}
          {isManual ? 'Manual' : 'Importada'}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <span
            className={`whitespace-nowrap font-mono-money text-sm font-semibold ${
              isIncome ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {signedValue}
          </span>
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-primary"
            aria-label={`Editar ${transaction.description}`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction)}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-destructive"
            aria-label={`Excluir ${transaction.description}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
