import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUrlParam } from '../../hooks/useUrlFilters';
import {
  Pencil,
  Trash2,
  Plus,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Loader2,
  Receipt,
  SearchX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
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

  const hasActiveFilters = !!search || typeFilter !== 'all' || !!fromDate || !!toDate;

  const columns = [
    {
      id: 'date',
      label: 'Date',
      render: (payment: Payment) => (
        <span className="text-sm tabular-nums">{formatDate(payment.payment_date)}</span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (payment: Payment) => {
        const isIncome = payment.type === PAYMENT_TYPES.INCOME;
        return (
          <Badge
            variant="outline"
            className={cn(
              'capitalize',
              isIncome
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            )}
          >
            {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
            {payment.type}
          </Badge>
        );
      },
    },
    {
      id: 'category',
      label: 'Category',
      render: (payment: Payment) =>
        payment.category ? (
          <Badge variant="outline" className="capitalize">
            {payment.category}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Uncategorized</span>
        ),
    },
    {
      id: 'description',
      label: 'Description',
      render: (payment: Payment) => (
        <p className="max-w-[220px] truncate text-sm text-muted-foreground">
          {payment.description || '—'}
        </p>
      ),
      hideOnMobile: true,
    },
    {
      id: 'method',
      label: 'Method',
      render: (payment: Payment) => (
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-primary capitalize"
        >
          {payment.payment_method.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      numeric: true,
      render: (payment: Payment) => {
        const isIncome = payment.type === PAYMENT_TYPES.INCOME;
        return (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              isIncome ? 'text-success' : 'text-destructive'
            )}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(payment.amount)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (payment: Payment) => (
        <div className="flex justify-center gap-1">
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
        </div>
      ),
    },
  ];

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
          icon={hasActiveFilters ? <SearchX /> : <Receipt />}
          title={hasActiveFilters ? 'No matching payments' : 'No payments yet'}
          message={
            hasActiveFilters
              ? 'No payment matches the current search, type or date range.'
              : 'Record income and expenses to keep your cash flow up to date.'
          }
          actionLabel={!hasActiveFilters ? 'Add payment' : undefined}
          actionIcon={!hasActiveFilters ? <Plus /> : undefined}
          onAction={!hasActiveFilters ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <>
        <ResponsiveTable
          columns={columns}
          data={payments}
          keyExtractor={(payment) => payment.id.toString()}
          emptyIcon={<Receipt />}
          emptyTitle="No payments yet"
          emptyMessage="Record income and expenses to keep your cash flow up to date."
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="border-t border-border/70 p-4 text-center">
          <div ref={observerTarget} className="h-5" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading more payments...</span>
            </div>
          )}
          {!hasNextPage && payments.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
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

      <div className="space-y-5">
        {/* Summary strip */}
        {summary && (
          <Card className="gap-0 overflow-hidden py-0">
            <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
              {[
                {
                  label: 'Total income',
                  value: formatCurrency(summary.total_earnings),
                  tone: 'text-success',
                },
                {
                  label: 'Total expenses',
                  value: formatCurrency(summary.total_spends),
                  tone: 'text-destructive',
                },
                {
                  label: 'Net balance',
                  value: formatCurrency(summary.total_earnings - summary.total_spends),
                  tone:
                    summary.total_earnings - summary.total_spends >= 0
                      ? 'text-success'
                      : 'text-destructive',
                },
                {
                  label: 'Total payments',
                  value: summary.payment_count.toLocaleString('en-IN'),
                  tone: 'text-foreground',
                },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {item.label}
                  </span>
                  <p className={cn('mt-1 text-xl font-semibold tabular-nums', item.tone)}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Toolbar: search + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by description..."
            className="sm:max-w-xs"
          />

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            {isFetching && !isFetchingNextPage && !showFullLoading && (
              <span className="text-xs text-muted-foreground">Searching...</span>
            )}
            <ToggleGroup
              type="single"
              value={typeFilter}
              onValueChange={handleTypeFilterChange}
              variant="outline"
              size="sm"
              className="w-full sm:w-fit"
            >
              <ToggleGroupItem value="all" className="flex-1 sm:flex-initial">All</ToggleGroupItem>
              <ToggleGroupItem value={PAYMENT_TYPES.INCOME} className="flex-1 sm:flex-initial">Income</ToggleGroupItem>
              <ToggleGroupItem value={PAYMENT_TYPES.EXPENSE} className="flex-1 sm:flex-initial">Expense</ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center gap-2">
              <div className="grid gap-1">
                <Label htmlFor="payments-from-date" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="payments-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value || '')}
                  className="h-9 w-[9.5rem] tabular-nums"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="payments-to-date" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="payments-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value || '')}
                  className="h-9 w-[9.5rem] tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <Card className="gap-0 overflow-hidden py-0">{renderTableContent()}</Card>
      </div>

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
        confirmColor="error"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PaymentsPage;
