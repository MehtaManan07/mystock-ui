import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  CreditCard,
  Download,
  ShoppingCart,
  Truck,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { RecordPaymentDialog } from './components/RecordPaymentDialog';
import {
  useTransaction,
  useDeleteTransaction,
  useRecordPayment,
  useInvoiceDownloadUrl,
  useGenerateInvoice,
} from '../../hooks/useTransactions';
import { TRANSACTION_TYPES, PAYMENT_STATUS, PRODUCT_DETAILS_DISPLAY_MODE } from '../../constants';
import { useNotificationStore } from '../../stores/notificationStore';
import type { CreatePaymentDto } from '../../types';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transactionId = parseInt(id || '0', 10);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);

  // Data fetching
  const { data: transaction, isLoading, isError, refetch } = useTransaction(transactionId);

  // Mutations
  const deleteMutation = useDeleteTransaction();
  const recordPaymentMutation = useRecordPayment();
  const downloadInvoiceMutation = useInvoiceDownloadUrl();
  const generateInvoiceMutation = useGenerateInvoice();
  
  // Notifications
  const { success, error: showError } = useNotificationStore();

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const sectionLabel =
    'text-xs font-semibold tracking-wider text-muted-foreground uppercase';

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'border-success/30 bg-success/10 text-success';
      case PAYMENT_STATUS.PARTIAL:
        return 'border-warning/40 bg-warning/10 text-warning';
      case PAYMENT_STATUS.UNPAID:
        return 'border-destructive/30 bg-destructive/10 text-destructive';
      default:
        return 'border-warning/40 bg-warning/10 text-warning';
    }
  };

  const formatDisplayMode = (mode: string): string => {
    switch (mode) {
      case PRODUCT_DETAILS_DISPLAY_MODE.CUSTOMER_SKU:
        return 'Customer SKU';
      case PRODUCT_DETAILS_DISPLAY_MODE.COMPANY_SKU:
        return 'Company SKU';
      case PRODUCT_DETAILS_DISPLAY_MODE.PRODUCT_NAME:
        return 'Product Name';
      default:
        return mode;
    }
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(transactionId, {
      onSuccess: () => navigate('/transactions'),
    });
  };

  const handleRecordPayment = (data: CreatePaymentDto) => {
    recordPaymentMutation.mutate(
      { transactionId, data },
      {
        onSuccess: () => {
          setPaymentDialogOpen(false);
          refetch();
        },
      }
    );
  };

  const handleDownloadInvoice = async () => {
    try {
      const result = await downloadInvoiceMutation.mutateAsync({ transactionId });
      window.open(result.download_url, '_blank');
    } catch (error: any) {
      console.error('Failed to get invoice URL', error);
      showError(error?.message || 'Failed to get invoice download URL');
    }
  };

  const handleGenerateInvoice = (forceRegenerate = false) => {
    generateInvoiceMutation.mutate(
      { transactionId, forceRegenerate },
      {
        onSuccess: () => {
          success('Invoice generated successfully');
          refetch(); // Refresh transaction data to show download button
          if (forceRegenerate) {
            setRegenerateDialogOpen(false);
          }
        },
        onError: (err: any) => {
          const errorMessage = err?.message || err?.response?.data?.detail || 'Failed to generate invoice';
          showError(errorMessage);
          if (forceRegenerate) {
            setRegenerateDialogOpen(false);
          }
        },
      }
    );
  };

  const handleConfirmRegenerate = () => {
    handleGenerateInvoice(true);
  };

  if (isLoading) {
    return <LoadingState message="Loading transaction details..." fullPage />;
  }

  if (isError || !transaction) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const isSale = transaction.type === TRANSACTION_TYPES.SALE;
  const isPaid = transaction.payment_status === PAYMENT_STATUS.PAID;

  return (
    <div>
      <PageHeader
        title={transaction.transaction_number}
        subtitle={`${transaction.type.toUpperCase()} • ${formatDate(transaction.transaction_date)}`}
        breadcrumbs={[
          { label: 'Transactions', path: '/transactions' },
          { label: transaction.transaction_number },
        ]}
      />

      {/* Action buttons */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" aria-label="Back to Transactions">
                <a
                  href="/transactions"
                  onClick={(e: React.MouseEvent) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      navigate('/transactions');
                    }
                  }}
                >
                  <ArrowLeft />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Transactions</TooltipContent>
          </Tooltip>

          {!transaction.invoice_url ? (
            <Button
              variant="outline"
              onClick={() => handleGenerateInvoice(false)}
              disabled={generateInvoiceMutation.isPending}
            >
              <Receipt />
              {generateInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadInvoice}
                disabled={downloadInvoiceMutation.isPending}
              >
                <Download />
                {downloadInvoiceMutation.isPending ? 'Loading...' : 'Download Invoice'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRegenerateDialogOpen(true)}
                disabled={generateInvoiceMutation.isPending}
              >
                <Receipt />
                Regenerate Invoice
              </Button>
            </>
          )}

          {!isPaid && (
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <CreditCard />
              Record Payment
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete Transaction"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Transaction</TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Transaction Summary Card */}
          <div className="col-span-12 md:col-span-4">
            <Card>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  {isSale ? (
                    <ShoppingCart className="size-4 text-primary" />
                  ) : (
                    <Truck className="size-4 text-muted-foreground" />
                  )}
                  <h3 className="text-base font-semibold">
                    {isSale ? 'Sale' : 'Purchase'} Details
                  </h3>
                </div>
                <Separator className="mb-4" />

                <div className="flex flex-col gap-4">
                  <div>
                    <span className={sectionLabel}>
                      {isSale ? 'Customer' : 'Supplier'}
                    </span>
                    <p
                      className="mt-1 cursor-pointer font-semibold hover:underline"
                      onClick={() => navigate(`/contacts/${transaction.contact.id}`)}
                    >
                      {transaction.contact.name}
                    </p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {transaction.contact.phone}
                    </p>
                  </div>

                  <div>
                    <span className={sectionLabel}>Date</span>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>

                  <div>
                    <span className={sectionLabel}>Status</span>
                    <div className="mt-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          getStatusBadgeClass(transaction.payment_status)
                        )}
                      >
                        {transaction.payment_status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm text-muted-foreground">Subtotal</p>
                      <p className="text-sm tabular-nums">
                        {formatCurrency(transaction.subtotal)}
                      </p>
                    </div>
                    {transaction.tax_amount > 0 && transaction.tax_type === 'cgst_sgst' ? (
                      <>
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm text-muted-foreground">CGST</p>
                          <p className="text-sm tabular-nums">
                            {formatCurrency(transaction.cgst_amount!)}
                          </p>
                        </div>
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm text-muted-foreground">SGST</p>
                          <p className="text-sm tabular-nums">
                            {formatCurrency(transaction.sgst_amount!)}
                          </p>
                        </div>
                      </>
                    ) : transaction.tax_amount > 0 ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-sm text-muted-foreground">IGST</p>
                        <p className="text-sm tabular-nums">
                          {formatCurrency(transaction.tax_amount)}
                        </p>
                      </div>
                    ) : null}
                    {transaction.discount_amount > 0 && (
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <p className="text-sm tabular-nums text-destructive">
                          -{formatCurrency(transaction.discount_amount)}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-semibold">Total</p>
                      <p className="font-semibold tabular-nums">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm text-success">Paid</p>
                      <p className="text-sm tabular-nums text-success">
                        {formatCurrency(transaction.paid_amount)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'flex items-baseline justify-between gap-4 font-semibold',
                        transaction.balance_due > 0 ? 'text-destructive' : 'text-foreground'
                      )}
                    >
                      <p>Balance Due</p>
                      <p className="tabular-nums">
                        {formatCurrency(transaction.balance_due)}
                      </p>
                    </div>
                  </div>

                  {transaction.notes && (
                    <>
                      <Separator />
                      <div>
                        <span className={sectionLabel}>Notes</span>
                        <p className="mt-1 text-sm leading-relaxed">{transaction.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div>
                    <span className={sectionLabel}>Invoice Display Mode</span>
                    <p className="mt-1 text-sm">
                      {formatDisplayMode(transaction.product_details_display_mode)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items and Payments */}
          <div className="col-span-12 space-y-5 md:col-span-8">
            {/* Items Card */}
            <Card>
              <CardContent>
                <h3 className="mb-2 text-base font-semibold">
                  Items ({transaction.items.length})
                </h3>
                <Separator className="mb-4" />

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Container</TableHead>
                        <TableHead numeric>Qty</TableHead>
                        <TableHead numeric>Unit Price</TableHead>
                        <TableHead numeric>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transaction.items.map((item) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/products/${item.product.id}`)}
                        >
                          <TableCell className="whitespace-normal">
                            <p className="text-sm font-medium">
                              {item.product.name}
                            </p>
                            <span className="block text-xs text-muted-foreground">
                              {item.product.size} • {item.product.packing}
                            </span>
                            {item.product.company_sku && (
                              <span className="block font-mono text-xs tabular-nums text-muted-foreground">
                                SKU: {item.product.company_sku}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.container ? (
                              <Badge asChild variant="outline">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/containers/${item.container!.id}`);
                                  }}
                                >
                                  {item.container.name}
                                </button>
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell numeric>{item.quantity} items</TableCell>
                          <TableCell numeric>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell numeric className="font-medium">
                            {formatCurrency(item.line_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payments Card */}
            <Card>
              <CardContent>
                <h3 className="mb-2 text-base font-semibold">
                  Payments ({transaction.payments.length})
                </h3>
                <Separator className="mb-4" />

                {transaction.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead numeric>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transaction.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <span className="text-sm tabular-nums">
                                {formatDate(payment.payment_date)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {payment.payment_method.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                {payment.reference_number || '—'}
                              </p>
                            </TableCell>
                            <TableCell numeric className="font-medium text-success">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    compact
                    icon={<CreditCard />}
                    title="No payments recorded"
                    message={
                      isPaid
                        ? 'This transaction has no recorded payments.'
                        : 'Record a payment to start clearing the balance due.'
                    }
                    {...(isPaid
                      ? {}
                      : {
                          actionLabel: 'Record payment',
                          actionIcon: <CreditCard />,
                          onAction: () => setPaymentDialogOpen(true),
                        })}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transaction.transaction_number}"? This will reverse all inventory and balance changes. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        transactionNumber={transaction.transaction_number}
        balanceDue={transaction.balance_due}
        isLoading={recordPaymentMutation.isPending}
        onSubmit={handleRecordPayment}
        onClose={() => setPaymentDialogOpen(false)}
      />

      {/* Regenerate Invoice Confirmation Dialog */}
      <ConfirmDialog
        open={regenerateDialogOpen}
        title="Regenerate Invoice"
        message={`Are you sure you want to regenerate the invoice for "${transaction.transaction_number}"? This will replace the existing invoice.`}
        confirmLabel="Regenerate"
        confirmColor="primary"
        isLoading={generateInvoiceMutation.isPending}
        onConfirm={handleConfirmRegenerate}
        onCancel={() => setRegenerateDialogOpen(false)}
      />
    </div>
  );
};

export default TransactionDetailPage;
