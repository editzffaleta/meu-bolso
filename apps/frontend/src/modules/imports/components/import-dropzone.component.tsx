'use client';

import { useCallback, useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/class-name.util';
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
        className="rounded-2xl border border-border bg-muted/40 px-6 py-9 text-center"
        aria-busy="true"
      >
        <Loader2 className="mx-auto mb-4 size-9 animate-spin text-primary" />
        <p className="mb-1 text-sm font-bold">Processando extrato…</p>
        {processingFileName ? (
          <p className="font-mono-money text-xs text-muted-foreground">{processingFileName}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
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
      className={cn(
        'cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/40 px-6 py-9 text-center transition-colors',
        isDragOver && 'border-primary bg-primary/5',
      )}
    >
      <span className="mx-auto mb-3.5 grid size-15 place-items-center rounded-2xl border border-border bg-card">
        <CloudUpload className="size-7.5 text-primary" />
      </span>
      <p className="mb-1 text-sm font-bold">Arraste o arquivo aqui</p>
      <p className="text-xs text-muted-foreground">
        ou clique para selecionar · CSV, OFX até 2 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMPORT_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
