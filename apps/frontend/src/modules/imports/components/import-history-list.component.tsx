'use client';

import { Icon } from '@/shared/components/ui/icon';
import { formatDateBR } from '@/modules/transactions/util/format-currency.util';
import { importStatusLabel, type ImportRecord } from '@/modules/imports/types/import.type';

type ImportHistoryListProps = {
  imports: ImportRecord[];
  isLoading: boolean;
};

function statusVisual(status: ImportRecord['status']) {
  if (status === 'done') {
    return { color: 'var(--primary)', bg: 'var(--primary-soft)', icon: 'check_circle' };
  }
  if (status === 'failed') {
    return { color: '#dc2626', bg: 'rgba(220,38,38,.12)', icon: 'error' };
  }
  return { color: '#d97706', bg: 'rgba(217,119,6,.12)', icon: 'sync' };
}

export function ImportHistoryList({ imports, isLoading }: ImportHistoryListProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--card-border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 700 }}>
        Histórico de importações
      </div>

      {isLoading ? (
        <div aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`import-history-skeleton-${index}`}
              style={{
                height: 64,
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--primary-soft)',
            }}
          >
            <Icon name="history" size={28} color="var(--primary)" />
          </span>
          <div>
            <h3 style={{ fontSize: 13.5, fontWeight: 700 }}>Nenhuma importação ainda</h3>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Suas importações anteriores aparecerão aqui.
            </p>
          </div>
        </div>
      ) : (
        imports.map((item) => {
          const visual = statusVisual(item.status);
          const summary = `${item.totalRows} linhas · ${item.importedRows} importadas · ${item.duplicateRows} duplicadas`;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '15px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  fontFamily: "'JetBrains Mono'",
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                }}
              >
                {item.format.toUpperCase()}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono'",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.fileName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 3 }}>
                  {formatDateBR(item.createdAt)} · {summary}
                </div>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 20,
                  color: visual.color,
                  background: visual.bg,
                  flexShrink: 0,
                }}
              >
                <Icon name={visual.icon} size={14} />
                {importStatusLabel(item.status)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
