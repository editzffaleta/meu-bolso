'use client';

import { useCallback, useRef, useState } from 'react';
import { Icon } from '@/shared/components/ui/icon';
import { ACCEPTED_IMPORT_EXTENSIONS, hasAcceptedImportExtension } from '@/modules/imports/types/import.type';

type ImportDropzoneProps = {
  isProcessing: boolean;
  processingFileName?: string;
  onFileAccepted: (file: File) => void;
  onRejected: () => void;
};

export function ImportDropzone({
  isProcessing,
  processingFileName,
  onFileAccepted,
  onRejected,
}: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!hasAcceptedImportExtension(file.name)) {
        onRejected();
        return;
      }

      onFileAccepted(file);
    },
    [onFileAccepted, onRejected],
  );

  if (isProcessing) {
    return (
      <div
        aria-busy="true"
        data-testid="import-dropzone"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '34px 20px',
          textAlign: 'center',
          background: 'var(--surface-2)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid var(--primary-line)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Processando extrato…</div>
        {processingFileName ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', fontFamily: "'JetBrains Mono'" }}>
            {processingFileName}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="import-dropzone"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
      style={{
        border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '38px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragOver ? 'var(--primary-soft)' : 'var(--surface-2)',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 14px',
        }}
      >
        <Icon name="cloud_upload" size={30} color="var(--primary)" />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Arraste o arquivo aqui</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
        ou clique para selecionar · CSV, OFX até 2 MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMPORT_EXTENSIONS.join(',')}
        style={{ display: 'none' }}
        data-testid="import-submit"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
