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
    <Card className="mb-6">
      <CardContent>
        <h3 className="mb-2 text-base font-semibold">
          Step 1 — Upload Excel File
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          The file should have columns for <strong>SKU</strong> and <strong>Quantity</strong>.
          Header row is auto-detected.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary"
        >
          <Upload className="mx-auto mb-2 size-12 text-muted-foreground" />
          <p>{fileName ?? 'Drag & drop or click to select a file'}</p>
          <span className="text-xs text-muted-foreground">
            .xlsx, .xls, .csv supported
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
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
