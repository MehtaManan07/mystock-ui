import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CircleAlert, Info, Paperclip } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from 'cn';
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
    <Dialog
      open
      onOpenChange={(next) => { if (!next && !upload.isPending) onClose(); }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
        showCloseButton={!upload.isPending}
      >
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{retryInvoice ? 'Retry PDF upload' : 'Register an existing PDF bill'}</DialogTitle>
          </DialogHeader>
          <Alert className="mt-4 mb-5">
            <Info />
            <AlertDescription>
              {retryInvoice
                ? 'Select the same original PDF. The reserved invoice details cannot be changed during a retry.'
                : 'Copy the issued PDF details exactly. This archives a bill; it does not create a sale, payment or stock movement. Existing transaction invoices already belong in Transactions.'}
            </AlertDescription>
          </Alert>
          <p className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Invoice &amp; customer
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="invoice_number">Invoice number</Label>
              <Input id="invoice_number" required value={metadata.invoice_number} disabled={locked}
                className="tabular-nums"
                onChange={(e) => update('invoice_number', e.target.value)} maxLength={50} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice_date">Invoice date</Label>
              <Input id="invoice_date" required type="date" value={metadata.invoice_date} disabled={locked}
                className="tabular-nums"
                onChange={(e) => update('invoice_date', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer name</Label>
              <Input id="customer_name" required value={metadata.customer_name} disabled={locked}
                onChange={(e) => update('customer_name', e.target.value)} maxLength={255} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_gstin">Customer GSTIN (if applicable)</Label>
              <Input id="customer_gstin" value={metadata.customer_gstin ?? ''} disabled={locked}
                className="tabular-nums uppercase"
                onChange={(e) => update('customer_gstin', e.target.value)} maxLength={15} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_address">Customer address</Label>
              <Input id="customer_address" value={metadata.customer_address ?? ''} disabled={locked}
                onChange={(e) => update('customer_address', e.target.value)} maxLength={500} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_phone">Customer phone</Label>
              <Input id="customer_phone" value={metadata.customer_phone ?? ''} disabled={locked}
                className="tabular-nums"
                onChange={(e) => update('customer_phone', e.target.value)} maxLength={50} />
            </div>
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Amounts
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {moneyFields.map(([key, label]) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label}</Label>
                <Input id={key} type="number" required value={metadata[key]} disabled={locked}
                  className="text-right tabular-nums"
                  onChange={(e) => update(key, e.target.value)} min={0} step="0.01" />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="round_off">Round-off (calculated)</Label>
              <Input id="round_off" value={roundOff} readOnly
                className="bg-muted text-right tabular-nums" />
            </div>
          </div>
          <div className="mt-6 grid gap-2">
            <Label htmlFor="notes">Notes / source</Label>
            <Textarea id="notes" value={metadata.notes ?? ''} disabled={locked}
              onChange={(e) => update('notes', e.target.value)} maxLength={2000} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border/70 border-dashed p-4">
            <Button
              asChild
              variant="outline"
              className={cn(
                'cursor-pointer',
                upload.isPending && 'pointer-events-none opacity-50'
              )}
            >
              {/* File input is wrapped in a label so the styled button opens the picker. */}
              <label>
                <Paperclip />
                Choose PDF
                <input hidden type="file" accept=".pdf,application/pdf" disabled={upload.isPending}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </Button>
            <p className={cn('min-w-0 flex-1 truncate text-sm', !file && 'text-muted-foreground')}>
              {file?.name ?? 'No file selected (maximum 10 MB)'}
            </p>
          </div>
          {(localError || upload.isError) && (
            <Alert variant="destructive" className="mt-4">
              <CircleAlert />
              <AlertDescription>
                {localError || pdfInvoiceError(upload.error)}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={upload.isPending}>Cancel</Button>
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? 'Saving...' : 'Save PDF bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
