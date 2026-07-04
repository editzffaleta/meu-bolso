'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Combobox } from '@/shared/components/ui/combobox';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listAccounts, AccountsApiError } from '@/modules/accounts/util/accounts-api.util';
import type { Account } from '@/modules/accounts/types/account.type';
import { ImportDropzone } from '@/modules/imports/components/import-dropzone.component';
import { ImportHistoryList } from '@/modules/imports/components/import-history-list.component';
import { ImportResultCard } from '@/modules/imports/components/import-result-card.component';
import type { ImportRecord, ImportStatementResult } from '@/modules/imports/types/import.type';
import { ImportsApiError, importStatement, listImports } from '@/modules/imports/util/imports-api.util';

function reportApiErrors(error: unknown) {
  if (error instanceof ImportsApiError || error instanceof AccountsApiError) {
    error.errors.forEach((code) => toast.error(getMessage(code)));
    return;
  }

  toast.error(getMessage('INTERNAL_SERVER_ERROR'));
}

export default function ImportsComponent() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileName, setProcessingFileName] = useState<string>();
  const [result, setResult] = useState<ImportStatementResult | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!token) return;

    try {
      const data = await listAccounts(token);
      setAccounts(data);
    } catch (error) {
      reportApiErrors(error);
    }
  }, [token]);

  const loadHistory = useCallback(async () => {
    if (!token) return;

    setIsLoadingHistory(true);
    try {
      const data = await listImports(token);
      setImports(data.items);
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadHistory();
  }, [loadHistory]);

  async function handleFileAccepted(file: File) {
    if (!token) return;

    if (!accountId) {
      toast.error('Selecione a conta de destino antes de importar.');
      return;
    }

    setIsProcessing(true);
    setProcessingFileName(file.name);

    try {
      const summary = await importStatement(token, file, accountId);
      setResult(summary);
      toast.success('Arquivo importado com sucesso!');
      await loadHistory();
    } catch (error) {
      reportApiErrors(error);
    } finally {
      setIsProcessing(false);
      setProcessingFileName(undefined);
    }
  }

  function handleRejected() {
    toast.error(getMessage('import.format.unsupported'));
  }

  function handleReset() {
    setResult(null);
  }

  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.institution ? `${account.name} · ${account.institution}` : account.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Importar"
        title="Importar extrato"
        subtitle="Envie um arquivo CSV ou OFX do seu banco para criar as transações automaticamente."
      />

      <div className="grid gap-4.5 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-border bg-card p-5.5 shadow-sm">
          <div className="mb-4 space-y-1">
            <p className="text-sm font-bold">Importar extrato</p>
            <p className="text-xs text-muted-foreground">
              Envie um arquivo <strong>CSV</strong> ou <strong>OFX</strong> do seu banco.
            </p>
          </div>

          <div className="mb-4.5 space-y-2">
            <Label>Conta de destino</Label>
            <Combobox
              options={accountOptions}
              value={accountId}
              onChange={setAccountId}
              placeholder="Selecione a conta"
              emptyText="Nenhuma conta cadastrada."
            />
          </div>

          {result ? (
            <ImportResultCard result={result} onReset={handleReset} />
          ) : (
            <ImportDropzone
              isProcessing={isProcessing}
              processingFileName={processingFileName}
              onFileAccepted={handleFileAccepted}
              onRejected={handleRejected}
            />
          )}
        </div>

        <ImportHistoryList imports={imports} isLoading={isLoadingHistory} />
      </div>
    </div>
  );
}
