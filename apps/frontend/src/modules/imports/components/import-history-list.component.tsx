'use client';

import { CheckCircle2, History, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/class-name.util';
import { formatDateBR } from '@/modules/transactions/util/format-currency.util';
import { importStatusLabel, type ImportRecord } from '@/modules/imports/types/import.type';

type ImportHistoryListProps = {
  imports: ImportRecord[];
  isLoading: boolean;
};

function statusStyles(status: ImportRecord['status']) {
  if (status === 'done') {
    return { className: 'bg-emerald-500/10 text-emerald-500', Icon: CheckCircle2 };
  }
  if (status === 'failed') {
    return { className: 'bg-rose-500/10 text-rose-500', Icon: XCircle };
  }
  return { className: 'bg-amber-500/10 text-amber-500', Icon: Loader2 };
}

export function ImportHistoryList({ imports, isLoading }: ImportHistoryListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4 text-sm font-bold">
        Histórico de importações
      </div>

      {isLoading ? (
        <div aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`import-history-skeleton-${index}`}
              className="h-16 animate-pulse border-b border-border bg-muted/40 last:border-b-0"
            />
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10">
            <History className="size-7 text-primary" />
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Nenhuma importação ainda</h3>
            <p className="text-xs text-muted-foreground">
              Suas importações anteriores aparecerão aqui.
            </p>
          </div>
        </div>
      ) : (
        imports.map((item) => {
          const { className, Icon } = statusStyles(item.status);
          const summary = `${item.totalRows} linhas · ${item.importedRows} importadas · ${item.duplicateRows} duplicadas`;

          return (
            <div
              key={item.id}
              className="flex items-center gap-3.5 border-b border-border px-5 py-4 last:border-b-0 hover:bg-muted/40"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 font-mono-money text-[11px] font-bold text-muted-foreground">
                {item.format.toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-mono-money text-sm font-semibold">{item.fileName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateBR(item.createdAt)} · {summary}
                </p>
              </div>

              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
                  className,
                )}
              >
                <Icon className={cn('size-3.5', item.status === 'processing' && 'animate-spin')} />
                {importStatusLabel(item.status)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
