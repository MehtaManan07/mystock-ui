import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  FileText,
  Info,
  Upload,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from 'cn';
import { pdfInvoicesApi, pdfInvoiceError } from '../../api/pdfInvoices.api';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { QUERY_KEYS, USER_ROLES } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import type { PdfInvoice, PdfInvoiceFilters } from '../../types/pdfInvoices';
import UploadPdfInvoiceDialog from './UploadPdfInvoiceDialog';

const ROWS_PER_PAGE = 25;

const currency = (value: string) => Number(value).toLocaleString('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2,
});

export default function PdfInvoicesPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canUpload = role === USER_ROLES.ADMIN || role === USER_ROLES.STAFF;
  const [filters, setFilters] = useState<PdfInvoiceFilters>({ search: '', from_date: '', to_date: '' });
  const [page, setPage] = useState(0);
  const [uploadDialog, setUploadDialog] = useState<{ retry?: PdfInvoice } | null>(null);
  const [preview, setPreview] = useState<{ invoice: PdfInvoice; url: string } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState('');
  const mounted = useRef(false);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.PDF_INVOICES, page, filters],
    queryFn: () => pdfInvoicesApi.list(page + 1, filters),
  });

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const setFilter = (field: keyof PdfInvoiceFilters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(0);
  };
  const viewPdf = async (invoice: PdfInvoice) => {
    setLoadingPdf(invoice.id);
    setPdfError('');
    try {
      const content = await pdfInvoicesApi.file(invoice.id);
      if (!mounted.current) return;
      setPreview({ invoice, url: URL.createObjectURL(content) });
    } catch (error) {
      setPdfError(pdfInvoiceError(error));
    } finally {
      setLoadingPdf(null);
    }
  };
  const columns = [
    {
      id: 'number',
      label: 'Invoice',
      render: (row: PdfInvoice) => (
        <div className="min-w-0">
          <p className="font-semibold tabular-nums">{row.invoice_number}</p>
          <span className="text-xs text-muted-foreground tabular-nums">
            FY {row.financial_year} &middot; {row.source}
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (row: PdfInvoice) => (
        <span className="tabular-nums">{format(parseISO(row.invoice_date), 'dd MMM yyyy')}</span>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      render: (row: PdfInvoice) => (
        <div className="min-w-0">
          <p className="text-sm font-medium">{row.customer_name}</p>
          <span className="text-xs text-muted-foreground tabular-nums">{row.customer_gstin}</span>
        </div>
      ),
    },
    {
      id: 'taxable',
      label: 'Taxable',
      numeric: true,
      render: (row: PdfInvoice) => currency(row.subtotal),
    },
    {
      id: 'tax',
      label: 'GST',
      numeric: true,
      render: (row: PdfInvoice) => (
        <span className="text-xs text-muted-foreground">
          {Number(row.igst) > 0
            ? `IGST ${currency(row.igst)}`
            : `CGST ${currency(row.cgst)} / SGST ${currency(row.sgst)}`}
        </span>
      ),
    },
    {
      id: 'total',
      label: 'Total',
      numeric: true,
      render: (row: PdfInvoice) => (
        <span className="font-semibold">{currency(row.total_amount)}</span>
      ),
    },
    {
      id: 'status',
      label: 'Storage',
      render: (row: PdfInvoice) => (
        <Badge
          variant="outline"
          className={cn(
            'capitalize',
            row.upload_status === 'ready'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-warning/40 bg-warning/10 text-warning'
          )}
        >
          {row.upload_status === 'ready' ? 'Saved' : 'Upload incomplete'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      label: 'PDF',
      isAction: true,
      render: (row: PdfInvoice) =>
        row.upload_status === 'ready' ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={loadingPdf !== null}
            onClick={() => void viewPdf(row)}
          >
            {loadingPdf === row.id ? 'Loading...' : 'View PDF'}
          </Button>
        ) : canUpload ? (
          <Button variant="ghost" size="sm" onClick={() => setUploadDialog({ retry: row })}>
            Retry upload
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Ask an admin or staff member to retry
          </span>
        ),
    },
  ];

  const hasFilters = Boolean(filters.search || filters.from_date || filters.to_date);
  const total = query.data?.total ?? 0;
  const firstRow = total === 0 ? 0 : page * ROWS_PER_PAGE + 1;
  const lastRow = Math.min(total, (page + 1) * ROWS_PER_PAGE);

  return (
    <div className="space-y-5">
      <PageHeader
        title="PDF Bills"
        subtitle="Standalone invoices archived without stock movements or customer balance changes."
        actionLabel={canUpload ? 'Upload existing PDF' : undefined}
        actionIcon={<Upload />}
        onAction={() => setUploadDialog({})}
      />

      <Alert>
        <Info />
        <AlertDescription>
          This register is separate from Transactions. Only archived PDFs appear here;
          older local files must be imported. Incomplete uploads reserve their invoice
          number but are not yet downloadable.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Invoice, customer or GSTIN"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
          <div className="grid gap-2">
            <Label htmlFor="pdf-from-date" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              From
            </Label>
            <Input
              id="pdf-from-date"
              type="date"
              className="tabular-nums sm:w-[170px]"
              value={filters.from_date}
              onChange={(e) => setFilter('from_date', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pdf-to-date" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              To
            </Label>
            <Input
              id="pdf-to-date"
              type="date"
              className="tabular-nums sm:w-[170px]"
              value={filters.to_date}
              onChange={(e) => setFilter('to_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {pdfError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{pdfError}</AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss error"
            className="absolute top-2 right-2"
            onClick={() => setPdfError('')}
          >
            <X />
          </Button>
        </Alert>
      )}

      {query.isLoading ? (
        <LoadingState message="Loading PDF bills..." />
      ) : query.isError ? (
        <ErrorState
          message={pdfInvoiceError(query.error)}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <ResponsiveTable
            columns={columns}
            data={query.data?.items ?? []}
            keyExtractor={(row) => row.id}
            emptyIcon={<FileText />}
            emptyTitle={hasFilters ? 'No matching PDF bills' : 'No PDF bills yet'}
            emptyMessage={
              hasFilters
                ? 'Try a different search term or widen the date range.'
                : 'Upload an existing PDF invoice to archive it in this register.'
            }
          />
          {total > 0 && (
            <div className="flex items-center justify-end gap-4 border-t border-border/70 px-4 py-2.5">
            <span className="text-sm text-muted-foreground tabular-nums">
              {firstRow}&ndash;{lastRow} of {total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next page"
                disabled={lastRow >= total}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          )}
        </Card>
      )}

      {uploadDialog && <UploadPdfInvoiceDialog retryInvoice={uploadDialog.retry} onClose={() => setUploadDialog(null)} />}
      {preview && (
        <Dialog open onOpenChange={(open) => { if (!open) setPreview(null); }}>
          <DialogContent className="sm:max-w-6xl">
            <DialogHeader>
              <DialogTitle>Invoice {preview.invoice.invoice_number} — {preview.invoice.customer_name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">
                Round-off: {currency(preview.invoice.round_off)}.
              </span>{' '}
              {preview.invoice.notes}
            </p>
            <iframe src={preview.url} title={`Invoice ${preview.invoice.invoice_number}`}
              className="h-[70vh] w-full rounded-lg border border-border/70 bg-muted" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
              <Button asChild>
                <a href={preview.url}
                  download={`${preview.invoice.invoice_number.replaceAll('/', '-')}.pdf`}>Download PDF</a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
