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
        return 'bg-success text-success-foreground';
      case PAYMENT_STATUS.PARTIAL:
        return 'bg-warning text-warning-foreground';
      case PAYMENT_STATUS.UNPAID:
        return 'bg-destructive text-white';
      default:
        return 'bg-warning text-warning-foreground';
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
        <span className="text-sm font-semibold">
          {transaction.transaction_number}
        </span>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (transaction: Transaction) => (
        <span className="text-xs">
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
          className={
            transaction.type === TRANSACTION_TYPES.SALE
              ? 'border-primary/50 text-primary'
              : 'border-foreground/30 text-foreground'
          }
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
        <div>
          <p className="text-sm">{transaction.contact.name}</p>
          <p className="text-xs text-muted-foreground">{transaction.contact.phone}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      id: 'total',
      label: 'Total',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <span className="text-sm font-medium">
          {formatCurrency(transaction.total_amount)}
        </span>
      ),
    },
    {
      id: 'paid',
      label: 'Paid',
      align: 'right' as const,
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
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <span
          className={
            transaction.balance_due > 0
              ? 'text-sm font-semibold text-destructive'
              : 'text-sm text-muted-foreground'
          }
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
        <Badge className={getStatusBadgeClass(transaction.payment_status)}>
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
          title="No transactions found"
          message={hasActiveFilters ? 'Try different filters' : 'Create your first sale or purchase to get started'}
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
          emptyMessage="No transactions found"
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="p-4 text-center">
          <div ref={observerTarget} style={{ height: '20px' }} />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading more transactions...
              </p>
            </div>
          )}
          {!hasNextPage && transactions.length > 0 && (
            <span className="text-xs text-muted-foreground">
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
      />

      {/* Action Button */}
      <div className="mb-4 sm:mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus />
              New Transaction
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => navigate('/transactions/new-sale')}>
              <ShoppingCart className="text-primary" />
              New Sale
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/transactions/new-purchase')}>
              <Truck />
              New Purchase
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/transactions/new-deodap-bill')}>
              <Receipt className="text-warning" />
              Create Deodap Bill
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col flex-wrap gap-4 sm:mb-6 sm:flex-row">
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by transaction # or notes..."
            className="sm:w-full"
          />
        </div>

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

        <div className="grid w-full gap-2 sm:w-[150px]">
          <Label htmlFor="from-date">From</Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value || '')}
          />
        </div>
        <div className="grid w-full gap-2 sm:w-[150px]">
          <Label htmlFor="to-date">To</Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value || '')}
          />
        </div>

        {isFetching && !isFetchingNextPage && !showFullLoading && (
          <span className="self-center text-xs text-muted-foreground">
            Loading...
          </span>
        )}
      </div>

      {/* Transactions table */}
      <Card className="gap-0 py-0">{renderTableContent()}</Card>

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
