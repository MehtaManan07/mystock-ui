import { useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pdfInvoicesApi, pdfInvoiceError } from '../../api/pdfInvoices.api';
import { QUERY_KEYS } from '../../constants';
import { useNotificationStore } from '../../stores/notificationStore';
import type { PdfInvoice, PdfInvoiceMetadata } from '../../types/pdfInvoices';

interface Props {
  retryInvoice?: PdfInvoice;
  onClose: () => void;
}

function initialMetadata(invoice?: PdfInvoice): PdfInvoiceMetadata {
  return {
    invoice_number: invoice?.invoice_number ?? '',
    invoice_date: invoice?.invoice_date ?? format(new Date(), 'yyyy-MM-dd'),
    customer_name: invoice?.customer_name ?? '',
    customer_gstin: invoice?.customer_gstin ?? null,
    customer_address: invoice?.customer_address ?? null,
    customer_phone: invoice?.customer_phone ?? null,
    subtotal: invoice?.subtotal ?? '',
    cgst: invoice?.cgst ?? '0',
    sgst: invoice?.sgst ?? '0',
    igst: invoice?.igst ?? '0',
    round_off: invoice?.round_off ?? '0',
    total_amount: invoice?.total_amount ?? '',
    notes: invoice?.notes ?? null,
    source: invoice?.source ?? 'uploaded',
    line_items: invoice?.line_items ?? null,
  };
}

export default function UploadPdfInvoiceDialog({ retryInvoice, onClose }: Props) {
  const [metadata, setMetadata] = useState(() => initialMetadata(retryInvoice));
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState('');
  const queryClient = useQueryClient();
  const notify = useNotificationStore((state) => state.success);
  const upload = useMutation({
    mutationFn: ({ values, pdf }: { values: PdfInvoiceMetadata; pdf: File }) => pdfInvoicesApi.upload(values, pdf),
    onSuccess: () => {
      notify('PDF bill saved to the register and cloud storage. Stock and balances were not changed.');
      onClose();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PDF_INVOICES }),
  });
  const update = (key: keyof PdfInvoiceMetadata, value: string) => {
    setMetadata((old) => ({ ...old, [key]: value }));
  };
  const roundOff = metadata.total_amount !== '' && metadata.subtotal !== ''
    ? (Number(metadata.total_amount) - Number(metadata.subtotal)
      - Number(metadata.cgst) - Number(metadata.sgst) - Number(metadata.igst)).toFixed(2)
    : '0.00';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError('');
    if (!file || !file.name.toLowerCase().endsWith('.pdf') || file.size > 10 * 1024 * 1024 || file.size === 0) {
      setLocalError('Select a non-empty PDF no larger than 10 MB.');
      return;
    }
    if (!retryInvoice && (!Number.isFinite(Number(roundOff)) || Math.abs(Number(roundOff)) >= 1)) {
      setLocalError('Taxable amount and GST must match the total, allowing less than one rupee round-off.');
      return;
    }
    upload.mutate({
      pdf: file,
      values: retryInvoice ? metadata : {
        ...metadata,
        customer_gstin: metadata.customer_gstin?.trim().toUpperCase() || null,
        customer_address: metadata.customer_address?.trim() || null,
        customer_phone: metadata.customer_phone?.trim() || null,
        notes: metadata.notes?.trim() || null,
        round_off: roundOff,
      },
    });
  };
  const locked = Boolean(retryInvoice) || upload.isPending;
  const moneyFields = [
    ['subtotal', 'Taxable amount'], ['cgst', 'CGST'], ['sgst', 'SGST'],
    ['igst', 'IGST'], ['total_amount', 'Final invoice total'],
  ] as const;

  return (
    <Dialog open onClose={upload.isPending ? undefined : onClose} fullWidth maxWidth="md">
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{retryInvoice ? 'Retry PDF upload' : 'Register an existing PDF bill'}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {retryInvoice
              ? 'Select the same original PDF. The reserved invoice details cannot be changed during a retry.'
              : 'Copy the issued PDF details exactly. This archives a bill; it does not create a sale, payment or stock movement. Existing transaction invoices already belong in Transactions.'}
          </Alert>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            <TextField label="Invoice number" required value={metadata.invoice_number} disabled={locked}
              onChange={(e) => update('invoice_number', e.target.value)} inputProps={{ maxLength: 50 }} />
            <TextField label="Invoice date" required type="date" value={metadata.invoice_date} disabled={locked}
              onChange={(e) => update('invoice_date', e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Customer name" required value={metadata.customer_name} disabled={locked}
              onChange={(e) => update('customer_name', e.target.value)} inputProps={{ maxLength: 255 }} />
            <TextField label="Customer GSTIN (if applicable)" value={metadata.customer_gstin ?? ''} disabled={locked}
              onChange={(e) => update('customer_gstin', e.target.value)} inputProps={{ maxLength: 15 }} />
            <TextField label="Customer address" value={metadata.customer_address ?? ''} disabled={locked}
              onChange={(e) => update('customer_address', e.target.value)} inputProps={{ maxLength: 500 }} />
            <TextField label="Customer phone" value={metadata.customer_phone ?? ''} disabled={locked}
              onChange={(e) => update('customer_phone', e.target.value)} inputProps={{ maxLength: 50 }} />
            {moneyFields.map(([key, label]) => (
              <TextField key={key} label={label} type="number" required value={metadata[key]} disabled={locked}
                onChange={(e) => update(key, e.target.value)} inputProps={{ min: 0, step: '0.01' }} />
            ))}
            <TextField label="Round-off (calculated)" value={roundOff} slotProps={{ input: { readOnly: true } }} />
          </Box>
          <TextField label="Notes / source" multiline fullWidth sx={{ mt: 2 }} value={metadata.notes ?? ''}
            disabled={locked} onChange={(e) => update('notes', e.target.value)} inputProps={{ maxLength: 2000 }} />
          <Button component="label" variant="outlined" sx={{ mt: 2 }} disabled={upload.isPending}>
            Choose PDF
            <input hidden type="file" accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>
          <Typography variant="body2" sx={{ mt: 1 }}>{file?.name ?? 'No file selected (maximum 10 MB)'}</Typography>
          {(localError || upload.isError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {localError || pdfInvoiceError(upload.error)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={upload.isPending}>Cancel</Button>
          <Button variant="contained" type="submit" disabled={upload.isPending}>
            {upload.isPending ? 'Saving...' : 'Save PDF bill'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
