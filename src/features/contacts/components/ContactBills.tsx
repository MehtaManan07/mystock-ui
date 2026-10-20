import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, CircleAlert, FileText, ReceiptText, ShoppingCart, Truck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from 'cn';
import { pdfInvoiceError, pdfInvoicesApi } from '../../../api/pdfInvoices.api';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { ResponsiveTable } from '../../../components/common/ResponsiveTable';
import { useContactBills } from '../../../hooks/useContacts';
import type { ContactBill } from '../../../types';

type PdfBill = Extract<ContactBill, { source: 'pdf_invoice' }>;

const statusClasses = {
  paid: 'border-success/30 bg-success/10 text-success',
  partial: 'border-warning/40 bg-warning/10 text-warning',
  unpaid: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export function ContactBills({ contactId, contactName }: { contactId: number; contactName: string }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const query = useContactBills(contactId, page);
  const [preview, setPreview] = useState<{ bill: PdfBill; url: string } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState('');
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);

  const viewPdf = async (bill: PdfBill) => {
    if (loadingPdf !== null) return;
    setLoadingPdf(bill.id);
    setPdfError('');
    try {
      const content = await pdfInvoicesApi.file(bill.id);
      if (mounted.current) setPreview({ bill, url: URL.createObjectURL(content) });
    } catch (error) {
      if (mounted.current) setPdfError(pdfInvoiceError(error));
    } finally {
      if (mounted.current) setLoadingPdf(null);
    }
  };

  const openBill = (bill: ContactBill) => {
    if (bill.source === 'transaction') navigate(`/transactions/${bill.id}`);
    else if (bill.upload_status === 'ready') void viewPdf(bill);
    else navigate('/pdf-invoices');
  };

  const columns = [
    {
      id: 'number',
      label: 'Bill #',
      render: (bill: ContactBill) => <span className="font-semibold tabular-nums">{bill.number}</span>,
    },
    {
      id: 'date',
      label: 'Date',
      render: (bill: ContactBill) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {format(parseISO(bill.date), 'dd MMM yyyy')}
        </span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (bill: ContactBill) => bill.source === 'pdf_invoice' ? (
        <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
          <FileText /> PDF only
        </Badge>
      ) : (
        <Badge variant="outline" className={cn(
          'capitalize',
          bill.transaction_type === 'sale'
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-primary/30 bg-primary/10 text-primary'
        )}>
          {bill.transaction_type === 'sale' ? <ShoppingCart /> : <Truck />}
          {bill.transaction_type}
        </Badge>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      numeric: true,
      render: (bill: ContactBill) => (
        <span className="font-semibold tabular-nums">
          {Number(bill.total_amount).toLocaleString('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (bill: ContactBill) => bill.source === 'transaction' ? (
        <Badge variant="outline" className={cn('capitalize', statusClasses[bill.payment_status])}>
          {bill.payment_status}
        </Badge>
      ) : bill.upload_status === 'pending' ? (
        <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
          Upload incomplete
        </Badge>
      ) : <span className="text-sm text-muted-foreground">Archived · not in balance</span>,
    },
    {
      id: 'actions',
      label: 'Open',
      isAction: true,
      render: (bill: ContactBill) => bill.source === 'pdf_invoice' && bill.upload_status === 'ready' ? (
        <Button variant="ghost" size="sm" disabled={loadingPdf !== null} onClick={(event) => {
          event.stopPropagation();
          void viewPdf(bill);
        }}>
          {loadingPdf === bill.id ? 'Loading...' : 'View PDF'}
        </Button>
      ) : (
        <Button variant="ghost" size="sm" asChild>
          <Link to={bill.source === 'transaction' ? `/transactions/${bill.id}` : '/pdf-invoices'}
            onClick={(event) => event.stopPropagation()}>
            {bill.source === 'transaction' ? 'View transaction' : 'Open PDF register'}
          </Link>
        </Button>
      ),
    },
  ];

  const result = query.data;
  const firstRow = result?.items.length ? (page - 1) * result.page_size + 1 : 0;
  const lastRow = result?.items.length ? firstRow + result.items.length - 1 : 0;

  return (
    <>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="px-6 py-4">
          <h3 className="text-base font-semibold">Bills</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales, purchases and standalone PDFs, newest bill date first.
            PDF-only bills do not affect the accounting balance.
          </p>
        </div>
        <Separator />
        {pdfError && (
          <Alert variant="destructive" className="m-4 w-auto">
            <CircleAlert /><AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        )}
        {query.isLoading ? (
          <LoadingState message="Loading bills..." />
        ) : query.isError ? (
          <ErrorState message={pdfInvoiceError(query.error)} onRetry={() => { void query.refetch(); }} />
        ) : result && (
          <>
            <ResponsiveTable
              columns={columns}
              data={result.items}
              keyExtractor={(bill) => `${bill.source}-${bill.id}`}
              onRowClick={openBill}
              emptyIcon={<ReceiptText />}
              emptyTitle={page > 1 ? 'No bills on this page' : 'No bills yet'}
              emptyMessage={page > 1
                ? 'Go to the previous page to see earlier results.'
                : 'Sales, purchases and linked standalone PDF bills for this contact will appear here.'}
            />
            {(result.total > 0 || page > 1) && (
              <div className="flex items-center justify-end gap-4 border-t border-border/70 px-4 py-2.5">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {firstRow}&ndash;{lastRow} of {result.total}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Previous bills page"
                    disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>
                    <ChevronLeft />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Next bills page"
                    disabled={!result.has_more || query.isFetching} onClick={() => setPage(page + 1)}>
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      {preview && (
        <Dialog open onOpenChange={(open) => { if (!open) setPreview(null); }}>
          <DialogContent className="sm:max-w-6xl">
            <DialogHeader>
              <DialogTitle>Invoice {preview.bill.number} — {contactName}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Standalone PDF bill; not included in the accounting balance.</p>
            <iframe src={preview.url} title={`Invoice ${preview.bill.number}`}
              className="h-[70vh] w-full rounded-lg border border-border/70 bg-muted" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
              <Button asChild>
                <a href={preview.url} download={`${preview.bill.number.replaceAll('/', '-')}.pdf`}>Download PDF</a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
