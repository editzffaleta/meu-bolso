'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/shared/components/ui/icon';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listAccounts } from '@/modules/accounts/util/accounts-api.util';
import type { Account } from '@/modules/accounts/types/account.type';
import { ImportDropzone } from '@/modules/imports/components/import-dropzone.component';
import { ImportHistoryList } from '@/modules/imports/components/import-history-list.component';
import { ImportResultCard } from '@/modules/imports/components/import-result-card.component';
import type { ImportRecord, ImportStatementResult } from '@/modules/imports/types/import.type';
import { importStatement, listImports } from '@/modules/imports/util/imports-api.util';
import { ApiError } from '@/shared/util/http-client.util';

function reportApiErrors(error: unknown) {
  if (error instanceof ApiError) {
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start', animation: 'fadeUp .35s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            padding: 22,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Importar extrato</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>
            Envie um arquivo <b>CSV</b> ou <b>OFX</b> do seu banco.
          </div>

          <label
            htmlFor="import-account-select"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
          >
            Conta de destino
          </label>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <select
              id="import-account-select"
              data-testid="import-account-select"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '11px 40px 11px 14px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Selecione a conta
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.institution ? `${account.name} · ${account.institution}` : account.name}
                </option>
              ))}
            </select>
            <span
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-faint)',
              }}
            >
              <Icon name="expand_more" size={19} />
            </span>
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
      </div>

      <ImportHistoryList imports={imports} isLoading={isLoadingHistory} />
    </div>
  );
}
