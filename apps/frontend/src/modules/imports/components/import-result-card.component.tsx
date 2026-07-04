'use client';

import { Icon } from '@/shared/components/ui/icon';
import type { ImportStatementResult } from '@/modules/imports/types/import.type';

type ImportResultCardProps = {
  result: ImportStatementResult;
  onReset: () => void;
};

export function ImportResultCard({ result, onReset }: ImportResultCardProps) {
  return (
    <div
      data-testid="import-result-summary"
      style={{
        border: '1px solid var(--primary-line)',
        borderRadius: 14,
        padding: 20,
        background: 'var(--primary-soft)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--primary)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="check" size={20} color="#fff" />
        </span>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--primary)' }}>Importação concluída</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700 }}>{result.totalRows}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Lidas</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: '#16a34a' }}>
            {result.importedRows}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Importadas</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: '#d97706' }}>
            {result.duplicateRows}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Duplicadas</div>
        </div>
      </div>

      {result.invalidRows > 0 && (
        <div
          data-testid="import-invalid-rows"
          style={{
            marginTop: 10,
            background: 'var(--surface)',
            borderRadius: 10,
            padding: 12,
            textAlign: 'center',
            border: '1px solid #dc2626',
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: '#dc2626' }}>
            {result.invalidRows}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
            Linha(s) rejeitada(s) (não parseável)
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        style={{
          width: '100%',
          marginTop: 14,
          padding: 10,
          borderRadius: 10,
          border: 'none',
          background: 'var(--primary)',
          color: '#fff',
          fontSize: 13.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Importar outro arquivo
      </button>
    </div>
  );
}
