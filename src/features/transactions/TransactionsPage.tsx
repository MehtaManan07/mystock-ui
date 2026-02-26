import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import {
  Box,
  Card,
  Chip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Stack,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ShoppingCart as SaleIcon,
  LocalShipping as PurchaseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Receipt as DeodapIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { useTransactions, useDeleteTransaction } from '../../hooks/useTransactions';
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
  
  // Menu state for create button
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  
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

  // Data fetching
  const { data: transactions, isLoading, isFetching, isError, refetch } = useTransactions(filters);
  const deleteMutation = useDeleteTransaction();

  const showFullLoading = isLoading && !transactions;
  const hasActiveFilters = search || typeFilter !== 'all' || statusFilter !== 'all' || fromDate || toDate;

  const formatCurrency = (value: number) => {
    return `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case PAYMENT_STATUS.PAID:
        return 'success';
      case PAYMENT_STATUS.PARTIAL:
        return 'warning';
      case PAYMENT_STATUS.UNPAID:
        return 'error';
      default:
        return 'warning';
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
        <Typography variant="body2" fontWeight={600}>
          {transaction.transaction_number}
        </Typography>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (transaction: Transaction) => (
        <Typography variant="caption">
          {formatDate(transaction.transaction_date)}
        </Typography>
      ),
      hideOnMobile: true,
    },
    {
      id: 'type',
      label: 'Type',
      render: (transaction: Transaction) => (
        <Chip
          icon={transaction.type === TRANSACTION_TYPES.SALE ? <SaleIcon /> : <PurchaseIcon />}
          label={transaction.type}
          size="small"
          color={transaction.type === TRANSACTION_TYPES.SALE ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'contact',
      label: 'Contact',
      render: (transaction: Transaction) => (
        <Box>
          <Typography variant="body2">
            {transaction.contact.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {transaction.contact.phone}
          </Typography>
        </Box>
      ),
      hideOnMobile: true,
    },
    {
      id: 'total',
      label: 'Total',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <Typography variant="body2" fontWeight={500}>
          {formatCurrency(transaction.total_amount)}
        </Typography>
      ),
    },
    {
      id: 'paid',
      label: 'Paid',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <Typography variant="body2" color="success.main">
          {formatCurrency(transaction.paid_amount)}
        </Typography>
      ),
      hideOnMobile: true,
    },
    {
      id: 'balance',
      label: 'Balance',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <Typography
          variant="body2"
          color={transaction.balance_due > 0 ? 'error.main' : 'text.secondary'}
          fontWeight={transaction.balance_due > 0 ? 600 : 400}
        >
          {formatCurrency(transaction.balance_due)}
        </Typography>
      ),
      hideOnMobile: true,
    },
    {
      id: 'status',
      label: 'Status',
      render: (transaction: Transaction) => (
        <Chip
          label={transaction.payment_status}
          size="small"
          color={getStatusColor(transaction.payment_status)}
          variant="filled"
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (transaction: Transaction) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/transactions/${transaction.id}`);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteDialog(transaction);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
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
      <ResponsiveTable
        columns={columns}
        data={transactions}
        keyExtractor={(transaction) => transaction.id.toString()}
        onRowClick={(transaction) => navigate(`/transactions/${transaction.id}`)}
        emptyMessage="No transactions found"
      />
    );
  };

  return (
    <Box>
      <PageHeader
        title="Transactions"
        subtitle={transactions ? `${transactions.length} transactions` : 'Sales and purchases'}
      />

      {/* Action Button */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          endIcon={<ArrowDownIcon />}
          onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          New Transaction
        </Button>
        <Menu
          anchorEl={createMenuAnchor}
          open={Boolean(createMenuAnchor)}
          onClose={() => setCreateMenuAnchor(null)}
        >
          <MenuItem onClick={() => { setCreateMenuAnchor(null); navigate('/transactions/new-sale'); }}>
            <ListItemIcon>
              <SaleIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>New Sale</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setCreateMenuAnchor(null); navigate('/transactions/new-purchase'); }}>
            <ListItemIcon>
              <PurchaseIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText>New Purchase</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setCreateMenuAnchor(null); navigate('/transactions/new-deodap-bill'); }}>
            <ListItemIcon>
              <DeodapIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Create Deodap Bill</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Filters - responsive with Stack */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ mb: { xs: 2, sm: 3 } }}
        flexWrap="wrap"
      >
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: { xs: '100%', sm: '200px' } }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by transaction # or notes..."
          />
        </Box>

        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_, value) => value !== null && setTypeFilter(value as string)}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'initial' } }}>All</ToggleButton>
          <ToggleButton value={TRANSACTION_TYPES.SALE} sx={{ flex: { xs: 1, sm: 'initial' } }}>Sales</ToggleButton>
          <ToggleButton value={TRANSACTION_TYPES.PURCHASE} sx={{ flex: { xs: 1, sm: 'initial' } }}>Purchases</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, value) => value !== null && setStatusFilter(value as string)}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'initial' } }}>All</ToggleButton>
          <ToggleButton value={PAYMENT_STATUS.PAID} sx={{ flex: { xs: 1, sm: 'initial' } }}>Paid</ToggleButton>
          <ToggleButton value={PAYMENT_STATUS.PARTIAL} sx={{ flex: { xs: 1, sm: 'initial' } }}>Partial</ToggleButton>
          <ToggleButton value={PAYMENT_STATUS.UNPAID} sx={{ flex: { xs: 1, sm: 'initial' } }}>Unpaid</ToggleButton>
        </ToggleButtonGroup>

        <TextField
          type="date"
          size="small"
          label="From"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value || '')}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 150 } }}
        />
        <TextField
          type="date"
          size="small"
          label="To"
          value={toDate}
          onChange={(e) => setToDate(e.target.value || '')}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 150 } }}
        />

        {isFetching && !showFullLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Loading...
          </Typography>
        )}
      </Stack>

      {/* Transactions table */}
      <Card>{renderTableContent()}</Card>

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
    </Box>
  );
};

export default TransactionsPage;
