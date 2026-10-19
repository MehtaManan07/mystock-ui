import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUrlParam } from '../../hooks/useUrlFilters';
import {
  Pencil,
  Trash2,
  Plus,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePaymentsInfinite, usePaymentSummary, useDeletePayment } from '../../hooks/usePayments';
import { PaymentFormDialog } from './components/PaymentFormDialog';
import type { Payment, PaymentFilters } from '../../types';
import { PAYMENT_TYPES, type PaymentType } from '../../constants';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const PaymentsPage: React.FC = () => {
  // Filter state – synced with URL query params
  const [search, setSearch] = useUrlParam('q');
  const [typeFilter, setTypeFilter] = useUrlParam('type', 'all');
  const [fromDate, setFromDate] = useUrlParam('from');
  const [toDate, setToDate] = useUrlParam('to');

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Build filters object
  const filters: PaymentFilters = useMemo(() => {
    const f: PaymentFilters = { manual_only: true }; // Only show manual payments
    if (search) f.search = search;
    if (typeFilter !== 'all') f.type = typeFilter as PaymentType;
    if (fromDate) f.from_date = fromDate;
    if (toDate) f.to_date = toDate;
    return f;
  }, [search, typeFilter, fromDate, toDate]);

  // Infinite scroll ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // Data fetching with infinite scroll
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = usePaymentsInfinite(filters);
  const { data: summary } = usePaymentSummary(fromDate || undefined, toDate || undefined);
  const deleteMutation = useDeletePayment();

  // Flatten all pages into single array for rendering
  const payments = data?.pages ? data.pages.flatMap((page) => page?.items ?? []) : [];
  const totalCount = data?.pages?.[0]?.total ?? 0;
  const showFullLoading = isLoading && !data;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Handlers
  const handleOpenCreateDialog = () => {
    setEditingPayment(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setEditingPayment(null);
  };

  const handleOpenDeleteDialog = (payment: Payment) => {
    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (paymentToDelete) {
      await deleteMutation.mutateAsync(paymentToDelete.id);
      handleCloseDeleteDialog();
    }
  };

  const handleTypeFilterChange = (newType: string) => {
    if (newType) {
      setTypeFilter(newType);
    }
  };

  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading payments..." />;
    }

    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }

    if (!payments || payments.length === 0) {
      return (
        <EmptyState
          title="No payments found"
          message={
            search || typeFilter !== 'all' || fromDate || toDate
              ? 'Try different filters'
              : 'Add your first payment to get started'
          }
          actionLabel={
            !search && typeFilter === 'all' && !fromDate && !toDate
              ? 'Add Payment'
              : undefined
          }
          onAction={
            !search && typeFilter === 'all' && !fromDate && !toDate
              ? handleOpenCreateDialog
              : undefined
          }
        />
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="text-sm">{formatDate(payment.payment_date)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize',
                        payment.type === 'income'
                          ? 'border-success/50 text-success'
                          : 'border-destructive/50 text-destructive'
                      )}
                    >
                      {payment.type === 'income' ? <IncomeIcon /> : <ExpenseIcon />}
                      {payment.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.category || 'Uncategorized'}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[200px] overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                      {payment.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm capitalize">
                      {payment.payment_method.replace(/_/g, ' ')}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        payment.type === 'income' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {payment.type === 'income' ? '+' : '-'}
                      {formatCurrency(payment.amount)}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          onClick={() => handleOpenEditDialog(payment)}
                        >
                          <Pencil />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDeleteDialog(payment)}
                        >
                          <Trash2 />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Infinite scroll trigger and loading indicator */}
        <div className="p-4 text-center">
          <div ref={observerTarget} style={{ height: '20px' }} />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading more payments...</p>
            </div>
          )}
          {!hasNextPage && payments.length > 0 && (
            <span className="text-xs text-muted-foreground">
              All payments loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={totalCount > 0 ? `${totalCount} payments (showing ${payments.length})` : 'Manage your income and expenses'}
        action={
          <Button onClick={handleOpenCreateDialog}>
            <Plus />
            Add Payment
          </Button>
        }
      />

      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 flex flex-wrap gap-4">
          <Card className="min-w-[150px] flex-1 gap-0 p-4">
            <span className="text-xs text-muted-foreground">Total Income</span>
            <p className="text-xl font-semibold text-success">
              {formatCurrency(summary.total_earnings)}
            </p>
          </Card>
          <Card className="min-w-[150px] flex-1 gap-0 p-4">
            <span className="text-xs text-muted-foreground">Total Expenses</span>
            <p className="text-xl font-semibold text-destructive">
              {formatCurrency(summary.total_spends)}
            </p>
          </Card>
          <Card className="min-w-[150px] flex-1 gap-0 p-4">
            <span className="text-xs text-muted-foreground">Net Balance</span>
            <p
              className={cn(
                'text-xl font-semibold',
                summary.total_earnings - summary.total_spends >= 0
                  ? 'text-success'
                  : 'text-destructive'
              )}
            >
              {formatCurrency(summary.total_earnings - summary.total_spends)}
            </p>
          </Card>
          <Card className="min-w-[150px] flex-1 gap-0 p-4">
            <span className="text-xs text-muted-foreground">Total Transactions</span>
            <p className="text-xl font-semibold">{summary.payment_count}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by description..."
        />
        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <span className="text-xs text-muted-foreground">Searching...</span>
        )}
        <ToggleGroup
          type="single"
          value={typeFilter}
          onValueChange={handleTypeFilterChange}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value={PAYMENT_TYPES.INCOME}>Income</ToggleGroupItem>
          <ToggleGroupItem value={PAYMENT_TYPES.EXPENSE}>Expense</ToggleGroupItem>
        </ToggleGroup>
        <div className="grid gap-1">
          <Label htmlFor="payments-from-date" className="text-xs text-muted-foreground">
            From Date
          </Label>
          <Input
            id="payments-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value || '')}
            className="h-8 w-40"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="payments-to-date" className="text-xs text-muted-foreground">
            To Date
          </Label>
          <Input
            id="payments-to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value || '')}
            className="h-8 w-40"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card className="gap-0 overflow-hidden py-0">{renderTableContent()}</Card>

      {/* Payment Form Dialog */}
      <PaymentFormDialog
        open={formDialogOpen}
        payment={editingPayment}
        onClose={handleCloseFormDialog}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Payment"
        message={`Are you sure you want to delete this ${paymentToDelete?.type} of ${
          paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PaymentsPage;
