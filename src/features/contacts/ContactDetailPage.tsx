import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as GstinIcon,
  ShoppingCart as SaleIcon,
  LocalShipping as PurchaseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContactFormDialog } from './components/ContactFormDialog';
import { useContact, useUpdateContact, useDeleteContact } from '../../hooks/useContacts';
import { useTransactions } from '../../hooks/useTransactions';
import { CONTACT_TYPES, TRANSACTION_TYPES, PAYMENT_STATUS } from '../../constants';
import type { CreateContactDto, UpdateContactDto, Transaction } from '../../types';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = parseInt(id || '0', 10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Data fetching
  const { data: contact, isLoading, isError, refetch } = useContact(contactId);
  const { 
    data: transactions, 
    isLoading: transactionsLoading, 
    isError: transactionsError,
    refetch: refetchTransactions 
  } = useTransactions({ contact_id: contactId });

  // Mutations
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    return value < 0 ? `-${formatted}` : formatted;
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

  // Define table columns for transaction history
  const transactionColumns = [
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
      id: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <Typography variant="body2" fontWeight={500}>
          {formatCurrency(transaction.total_amount)}
        </Typography>
      ),
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
  ];

  const handleEditSubmit = (data: CreateContactDto) => {
    updateMutation.mutate(
      { id: contactId, data: data as UpdateContactDto },
      {
        onSuccess: () => setEditDialogOpen(false),
      }
    );
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(contactId, {
      onSuccess: () => {
        navigate('/contacts');
      },
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading contact details..." fullPage />;
  }

  if (isError || !contact) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <Box>
      <PageHeader
        title={contact.name}
        subtitle={contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
        breadcrumbs={[
          { label: 'Contacts', path: '/contacts' },
          { label: contact.name },
        ]}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Tooltip title="Back to Contacts">
          <IconButton onClick={() => navigate('/contacts')}>
            <BackIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Contact">
          <IconButton onClick={() => setEditDialogOpen(true)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Contact">
          <IconButton color="error" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Contact Info Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <PhoneIcon color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">{contact.phone}</Typography>
                  </Box>
                </Box>
                
                {contact.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <LocationIcon color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">{contact.address}</Typography>
                    </Box>
                  </Box>
                )}
                
                {contact.gstin && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <GstinIcon color="action" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        GSTIN
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {contact.gstin}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Balance Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contact Type
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={contact.type}
                      color={
                        contact.type === CONTACT_TYPES.CUSTOMER
                          ? 'primary'
                          : contact.type === CONTACT_TYPES.SUPPLIER
                          ? 'secondary'
                          : 'default'
                      }
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Current Balance
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={formatCurrency(contact.balance)}
                      color={
                        contact.balance > 0
                          ? 'success'
                          : contact.balance < 0
                          ? 'error'
                          : 'default'
                      }
                      sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {contact.balance > 0
                      ? 'They owe you this amount'
                      : contact.balance < 0
                      ? 'You owe them this amount'
                      : 'Account is settled'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions Card */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {transactionsLoading ? (
                <LoadingState message="Loading transactions..." />
              ) : transactionsError ? (
                <ErrorState onRetry={() => refetchTransactions()} />
              ) : !transactions || transactions.length === 0 ? (
                <EmptyState
                  title="No transactions found"
                  message="This contact has no transactions yet."
                />
              ) : (
                <ResponsiveTable
                  columns={transactionColumns}
                  data={transactions}
                  keyExtractor={(transaction) => transaction.id.toString()}
                  onRowClick={(transaction) => navigate(`/transactions/${transaction.id}`)}
                  emptyMessage="No transactions found"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <ContactFormDialog
        open={editDialogOpen}
        contact={contact}
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
        onClose={() => setEditDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contact.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default ContactDetailPage;
