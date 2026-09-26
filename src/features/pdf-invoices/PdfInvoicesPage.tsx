import { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Stack, TablePagination, TextField, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
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
      id: 'number', label: 'Invoice',
      render: (row: PdfInvoice) => (
        <Box><Typography fontWeight={600}>{row.invoice_number}</Typography>
          <Typography variant="caption">FY {row.financial_year} · {row.source}</Typography></Box>
      ),
    },
    { id: 'date', label: 'Date', render: (row: PdfInvoice) => format(parseISO(row.invoice_date), 'dd MMM yyyy') },
    {
      id: 'customer', label: 'Customer',
      render: (row: PdfInvoice) => (
        <Box><Typography variant="body2">{row.customer_name}</Typography>
          <Typography variant="caption">{row.customer_gstin}</Typography></Box>
      ),
    },
    { id: 'taxable', label: 'Taxable', align: 'right' as const, render: (row: PdfInvoice) => currency(row.subtotal) },
    {
      id: 'tax', label: 'GST', align: 'right' as const,
      render: (row: PdfInvoice) => (
        <Typography variant="caption">
          {Number(row.igst) > 0 ? `IGST ${currency(row.igst)}`
            : `CGST ${currency(row.cgst)} / SGST ${currency(row.sgst)}`}
        </Typography>
      ),
    },
    { id: 'total', label: 'Total', align: 'right' as const, render: (row: PdfInvoice) => currency(row.total_amount) },
    {
      id: 'status', label: 'Storage',
      render: (row: PdfInvoice) => <Chip size="small"
        label={row.upload_status === 'ready' ? 'Saved' : 'Upload incomplete'}
        color={row.upload_status === 'ready' ? 'success' : 'warning'} />,
    },
    {
      id: 'actions', label: 'PDF', isAction: true,
      render: (row: PdfInvoice) => row.upload_status === 'ready'
        ? <Button size="small" disabled={loadingPdf !== null} onClick={() => void viewPdf(row)}>
          {loadingPdf === row.id ? 'Loading...' : 'View PDF'}
        </Button>
        : canUpload
          ? <Button size="small" onClick={() => setUploadDialog({ retry: row })}>Retry upload</Button>
          : <Typography variant="caption">Ask an admin or staff member to retry</Typography>,
    },
  ];

  return (
    <Box>
      <PageHeader title="PDF Bills"
        subtitle="Standalone invoices archived without stock movements or customer balance changes."
        actionLabel={canUpload ? 'Upload existing PDF' : undefined}
        onAction={() => setUploadDialog({})} />
      <Alert severity="info" sx={{ mb: 2 }}>
        This register is separate from Transactions. Only archived PDFs appear here;
        older local files must be imported. Incomplete uploads reserve their invoice number but are not yet downloadable.
      </Alert>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <SearchInput value={filters.search} onChange={(value) => setFilter('search', value)}
          placeholder="Invoice, customer or GSTIN" />
        <TextField label="From" type="date" size="small" value={filters.from_date}
          onChange={(e) => setFilter('from_date', e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" size="small" value={filters.to_date}
          onChange={(e) => setFilter('to_date', e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>
      {pdfError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPdfError('')}>{pdfError}</Alert>}
      {query.isLoading ? <LoadingState message="Loading PDF bills..." />
        : query.isError ? <ErrorState message={pdfInvoiceError(query.error)} onRetry={() => { void query.refetch(); }} />
          : (
            <Card>
              <ResponsiveTable columns={columns} data={query.data?.items ?? []} keyExtractor={(row) => row.id}
                emptyMessage="No registered PDF bills match these filters." />
              <TablePagination component="div" count={query.data?.total ?? 0} rowsPerPage={25}
                rowsPerPageOptions={[25]} page={page} onPageChange={(_, value) => setPage(value)} />
            </Card>
          )}
      {uploadDialog && <UploadPdfInvoiceDialog retryInvoice={uploadDialog.retry} onClose={() => setUploadDialog(null)} />}
      {preview && (
        <Dialog open fullWidth maxWidth="lg" onClose={() => setPreview(null)}>
          <DialogTitle>Invoice {preview.invoice.invoice_number} — {preview.invoice.customer_name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Round-off: {currency(preview.invoice.round_off)}. {preview.invoice.notes}
            </Typography>
            <Box component="iframe" src={preview.url} title={`Invoice ${preview.invoice.invoice_number}`}
              sx={{ width: '100%', height: '70vh', border: 0 }} />
          </DialogContent>
          <DialogActions>
            <Button component="a" href={preview.url}
              download={`${preview.invoice.invoice_number.replaceAll('/', '-')}.pdf`}>Download PDF</Button>
            <Button onClick={() => setPreview(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
