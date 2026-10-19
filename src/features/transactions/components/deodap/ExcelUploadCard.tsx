import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface ExcelUploadCardProps {
  fileName: string | null;
  isProcessing: boolean;
  parseError: string | null;
  onFile: (file: File) => void;
}

export const ExcelUploadCard: React.FC<ExcelUploadCardProps> = ({
  fileName,
  isProcessing,
  parseError,
  onFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-base font-semibold">Step 1 — Upload Excel File</h3>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          The file should have columns for <strong>SKU</strong> and <strong>Quantity</strong>.
          Header row is auto-detected.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary/60 hover:bg-accent/40"
        >
          <Upload className="mx-auto mb-3 size-8 text-muted-foreground/70" />
          <p className="text-sm font-medium">
            {fileName ?? 'Drag & drop or click to select a file'}
          </p>
          <span className="mt-1 block text-xs text-muted-foreground">
            .xlsx, .xls, .csv supported
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm">Parsing file and looking up products...</p>
          </div>
        )}

        {parseError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
