import React, { useRef } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { UploadFile as UploadIcon } from '@mui/icons-material';

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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Step 1 — Upload Excel File
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The file should have columns for <strong>SKU</strong> and <strong>Quantity</strong>.
          Header row is auto-detected.
        </Typography>

        <Box
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: 'primary.main' },
          }}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1">
            {fileName ?? 'Drag & drop or click to select a file'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            .xlsx, .xls, .csv supported
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
        </Box>

        {isProcessing && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Parsing file and looking up products...</Typography>
          </Box>
        )}

        {parseError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {parseError}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
