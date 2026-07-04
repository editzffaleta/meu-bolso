'use client';

import { Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { ImportStatementResult } from '@/modules/imports/types/import.type';

type ImportResultCardProps = {
  result: ImportStatementResult;
  onReset: () => void;
};

export function ImportResultCard({ result, onReset }: ImportResultCardProps) {
  return (
    <div
      className="rounded-2xl border border-primary/30 bg-primary/5 p-5"
      data-testid="import-result-summary"
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="grid size-8.5 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Check className="size-5" />
        </span>
        <p className="text-sm font-bold text-primary">Importação concluída</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-lg bg-card p-3 text-center">
          <p className="font-mono-money text-xl font-bold">{result.totalRows}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Lidas</p>
        </div>
        <div className="rounded-lg bg-card p-3 text-center">
          <p className="font-mono-money text-xl font-bold text-emerald-500">{result.importedRows}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Importadas</p>
        </div>
        <div className="rounded-lg bg-card p-3 text-center">
          <p className="font-mono-money text-xl font-bold text-amber-500">{result.duplicateRows}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Duplicadas</p>
        </div>
      </div>

      <Button className="mt-3.5 w-full" onClick={onReset}>
        Importar outro arquivo
      </Button>
    </div>
  );
}
