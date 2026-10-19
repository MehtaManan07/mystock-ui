import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import {
  Eye,
  Trash2,
  Plus,
  ShoppingCart,
  Truck,
  ChevronDown,
  Receipt,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from 'cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { useTransactionsInfinite, useDeleteTransaction } from '../../hooks/useTransactions';
import { TRANSACTION_TYPES, PAYMENT_STATUS, type TransactionType, type PaymentStatus } from '../../constants';
import type { Transaction, TransactionFilters } from '../../types';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter states – synced with URL query params
  const [search, setSearch] = useUrlParam('q');
  const [typeFilter, setTypeFilter] = useUrlParam('type', 'all');
  const [statusFilter, setStatusFilter] = useUrlParam('status', 'all');
  const [fromDate, setFromDate] = useUrlParam('from');
  const [toDate, setToDate] = useUrlParam('to');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Build filters
  const filters: TransactionFilters = {
    search: search || undefined,
    type: typeFilter !== 'all' ? (typeFilter as TransactionType) : undefined,
    payment_status: statusFilter !== 'all' ? (statusFilter as PaymentStatus) : undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  };

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
  } = useTransactionsInfinite(filters);
  const deleteMutation = useDeleteTransaction();

  // Flatten all pages into single array for rendering
  const transactions = data?.pages ? data.pages.flatMap((page) => page?.items ?? []) : [];
  const totalCount = data?.pages?.[0]?.total ?? 0;
  const showFullLoading = isLoading && !data;
  const hasActiveFilters = search || typeFilter !== 'all' || statusFilter !== 'all' || fromDate || toDate;

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

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

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

  const handleOpenDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTransactionToDelete(null);
        },
      });
    }
  };

  // Define table columns for ResponsiveTable
  const columns = [
    {
      id: 'number',
      label: 'Transaction #',
      mobileLabel: 'TXN #',
      render: (transaction: Transaction) => (
        <span className="text-sm font-semibold tabular-nums">
          {transaction.transaction_number}
        </span>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (transaction: Transaction) => (
        <span className="text-sm whitespace-nowrap tabular-nums text-muted-foreground">
          {formatDate(transaction.transaction_date)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'type',
      label: 'Type',
      render: (transaction: Transaction) => (
        <Badge
          variant="outline"
          className={cn(
            'capitalize',
            transaction.type === TRANSACTION_TYPES.SALE
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-muted text-muted-foreground'
          )}
        >
          {transaction.type === TRANSACTION_TYPES.SALE ? <ShoppingCart /> : <Truck />}
          {transaction.type}
        </Badge>
      ),
    },
    {
      id: 'contact',
      label: 'Contact',
      render: (transaction: Transaction) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{transaction.contact.name}</p>
          <p className="truncate text-xs tabular-nums text-muted-foreground">
            {transaction.contact.phone}
          </p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'total',
      label: 'Total',
      numeric: true,
      render: (transaction: Transaction) => (
        <span className="text-sm font-semibold">
          {formatCurrency(transaction.total_amount)}
        </span>
      ),
    },
    {
      id: 'paid',
      label: 'Paid',
      numeric: true,
      render: (transaction: Transaction) => (
        <span className="text-sm text-success">
          {formatCurrency(transaction.paid_amount)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'balance',
      label: 'Balance',
      numeric: true,
      render: (transaction: Transaction) => (
        <span
          className={cn(
            'text-sm',
            transaction.balance_due > 0
              ? 'font-semibold text-destructive'
              : 'text-muted-foreground'
          )}
        >
          {formatCurrency(transaction.balance_due)}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      label: 'Status',
      render: (transaction: Transaction) => (
        <Badge
          variant="outline"
          className={cn('capitalize', getStatusBadgeClass(transaction.payment_status))}
        >
          {transaction.payment_status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (transaction: Transaction) => (
        <div className="flex justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                aria-label="View"
              >
                <a
                  href={`/transactions/${transaction.id}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      navigate(`/transactions/${transaction.id}`);
                    }
                  }}
                >
                  <Eye />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteDialog(transaction);
                }}
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
      return <LoadingState message="Loading transactions..." />;
    }

    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }

    if (!transactions || transactions.length === 0) {
      return (
        <EmptyState
          compact
          icon={<Receipt />}
          title="No transactions found"
          message={
            hasActiveFilters
              ? 'No transactions match the current filters. Try widening the date range or clearing a filter.'
              : 'Record your first sale or purchase and it will show up here.'
          }
          {...(hasActiveFilters
            ? {}
            : {
                actionLabel: 'New sale',
                actionIcon: <ShoppingCart />,
                onAction: () => navigate('/transactions/new-sale'),
                secondaryAction: (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/transactions/new-purchase')}
                  >
                    <Truck />
                    New purchase
                  </Button>
                ),
              })}
        />
      );
    }

    return (
      <>
        <ResponsiveTable
          columns={columns}
          data={transactions}
          keyExtractor={(transaction) => transaction.id.toString()}
          onRowClick={(transaction) => navigate(`/transactions/${transaction.id}`)}
          getRowHref={(transaction) => `/transactions/${transaction.id}`}
          emptyIcon={<Receipt />}
          emptyTitle="No transactions found"
          emptyMessage="Record your first sale or purchase and it will show up here."
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="border-t border-border/70 p-4 text-center">
          <div ref={observerTarget} className="h-5" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <p className="text-sm">Loading more transactions...</p>
            </div>
          )}
          {!hasNextPage && transactions.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              All transactions loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={totalCount > 0 ? `${totalCount} transactions (showing ${transactions.length})` : 'Sales and purchases'}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus />
                New Transaction
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigate('/transactions/new-sale')}>
                <ShoppingCart className="text-primary" />
                New Sale
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/transactions/new-purchase')}>
                <Truck className="text-muted-foreground" />
                New Purchase
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/transactions/new-deodap-bill')}>
                <Receipt className="text-warning" />
                Create Deodap Bill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by transaction # or notes..."
            className="sm:max-w-xs"
          />

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={typeFilter}
              onValueChange={(value) => value && setTypeFilter(value)}
              className="w-full sm:w-auto"
            >
              <ToggleGroupItem value="all" className="flex-1 sm:flex-initial">All</ToggleGroupItem>
              <ToggleGroupItem value={TRANSACTION_TYPES.SALE} className="flex-1 sm:flex-initial">Sales</ToggleGroupItem>
              <ToggleGroupItem value={TRANSACTION_TYPES.PURCHASE} className="flex-1 sm:flex-initial">Purchases</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value)}
              className="w-full sm:w-auto"
            >
              <ToggleGroupItem value="all" className="flex-1 sm:flex-initial">All</ToggleGroupItem>
              <ToggleGroupItem value={PAYMENT_STATUS.PAID} className="flex-1 sm:flex-initial">Paid</ToggleGroupItem>
              <ToggleGroupItem value={PAYMENT_STATUS.PARTIAL} className="flex-1 sm:flex-initial">Partial</ToggleGroupItem>
              <ToggleGroupItem value={PAYMENT_STATUS.UNPAID} className="flex-1 sm:flex-initial">Unpaid</ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-1 items-center gap-2 sm:flex-initial">
              <Label
                htmlFor="from-date"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                From
              </Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value || '')}
                className="h-9 w-full tabular-nums sm:w-[150px]"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 sm:flex-initial">
              <Label
                htmlFor="to-date"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                To
              </Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value || '')}
                className="h-9 w-full tabular-nums sm:w-[150px]"
              />
            </div>

            {isFetching && !isFetchingNextPage && !showFullLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
          </div>
        </div>

        {/* Transactions table */}
        <Card className="gap-0 overflow-hidden py-0">{renderTableContent()}</Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transactionToDelete?.transaction_number}"? This will reverse all inventory and balance changes. This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default TransactionsPage;
