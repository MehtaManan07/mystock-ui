import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Phone as PhoneIcon,
  MapPin as LocationIcon,
  Receipt as GstinIcon,
  ShoppingCart as SaleIcon,
  Truck as PurchaseIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
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

  // Filled badge styling for each payment status colour.
  const statusBadgeClass = {
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    error: 'bg-destructive text-white',
  } as const;

  // Tint standing in for the MUI chip `color` prop on contact type.
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case CONTACT_TYPES.CUSTOMER:
        return 'bg-primary text-primary-foreground';
      case CONTACT_TYPES.SUPPLIER:
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Define table columns for transaction history
  const transactionColumns = [
    {
      id: 'number',
      label: 'Transaction #',
      mobileLabel: 'TXN #',
      render: (transaction: Transaction) => (
        <p className="text-sm font-semibold">{transaction.transaction_number}</p>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      render: (transaction: Transaction) => (
        <span className="text-xs text-muted-foreground">
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
              ? 'border-primary/50 text-primary'
              : 'border-secondary-foreground/40 text-secondary-foreground'
          )}
        >
          {transaction.type === TRANSACTION_TYPES.SALE ? <SaleIcon /> : <PurchaseIcon />}
          {transaction.type}
        </Badge>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (transaction: Transaction) => (
        <p className="text-sm font-medium">{formatCurrency(transaction.total_amount)}</p>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (transaction: Transaction) => (
        <Badge className={cn('capitalize', statusBadgeClass[getStatusColor(transaction.payment_status)])}>
          {transaction.payment_status}
        </Badge>
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
    <div>
      <PageHeader
        title={contact.name}
        subtitle={contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
        breadcrumbs={[
          { label: 'Contacts', path: '/contacts' },
          { label: contact.name },
        ]}
      />

      {/* Action buttons */}
      <div className="mb-6 flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Back to Contacts" asChild>
              <a
                href="/contacts"
                onClick={(e: React.MouseEvent) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    navigate('/contacts');
                  }
                }}
              >
                <ArrowLeft />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Contacts</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit Contact"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Contact</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete Contact"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Contact</TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Contact Info Card */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Contact Information</h3>
              <Separator className="mb-4" />
              
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <PhoneIcon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <p>{contact.phone}</p>
                  </div>
                </div>
                
                {contact.address && (
                  <div className="flex items-start gap-4">
                    <LocationIcon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">Address</span>
                      <p>{contact.address}</p>
                    </div>
                  </div>
                )}
                
                {contact.gstin && (
                  <div className="flex items-start gap-4">
                    <GstinIcon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <span className="text-xs text-muted-foreground">GSTIN</span>
                      <p className="font-mono">{contact.gstin}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Card */}
        <div className="col-span-12 md:col-span-6">
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Account Summary</h3>
              <Separator className="mb-4" />
              
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Contact Type</span>
                  <div className="mt-1">
                    <Badge className={cn('px-3 py-1 text-sm capitalize', getTypeBadgeClass(contact.type))}>
                      {contact.type}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <span className="text-xs text-muted-foreground">Current Balance</span>
                  <div className="mt-1">
                    <Badge
                      className={cn(
                        'px-3 py-2 text-[1.1rem]',
                        contact.balance > 0
                          ? 'bg-success text-success-foreground'
                          : contact.balance < 0
                          ? 'bg-destructive text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {formatCurrency(contact.balance)}
                    </Badge>
                  </div>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {contact.balance > 0
                      ? 'They owe you this amount'
                      : contact.balance < 0
                      ? 'You owe them this amount'
                      : 'Account is settled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Card */}
        <div className="col-span-12">
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Recent Transactions</h3>
              <Separator className="mb-4" />
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
        </div>
      </div>

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
    </div>
  );
};

export default ContactDetailPage;
