import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  IconButton,
  Chip,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Person as CustomerIcon,
  LocalShipping as SupplierIcon,
  SwapHoriz as BothIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ContactFormDialog } from './components/ContactFormDialog';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '../../hooks/useContacts';
import { CONTACT_TYPES, type ContactType } from '../../constants';
import type { Contact, CreateContactDto, UpdateContactDto, ContactFilters } from '../../types';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'all'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative'>('all');
  
  // Build filters
  const filters: ContactFilters = {
    search: search || undefined,
    types: typeFilter !== 'all' ? [typeFilter] : undefined,
    balance: balanceFilter !== 'all' ? balanceFilter : undefined,
  };
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Data fetching
  const { data: contacts, isLoading, isFetching, isError, refetch } = useContacts(filters);
  
  // Only show full loading on initial load (no data yet)
  const showFullLoading = isLoading && !contacts;
  
  // Mutations
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  // Handlers
  const handleOpenCreateDialog = () => {
    setSelectedContact(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedContact(null);
  };

  const handleFormSubmit = (data: CreateContactDto) => {
    if (selectedContact) {
      updateMutation.mutate(
        { id: selectedContact.id, data: data as UpdateContactDto },
        {
          onSuccess: () => handleCloseFormDialog(),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => handleCloseFormDialog(),
      });
    }
  };

  const handleOpenDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteMutation.mutate(contactToDelete.id, {
        onSuccess: () => handleCloseDeleteDialog(),
      });
    }
  };

  const handleViewContact = (contact: Contact) => {
    navigate(`/contacts/${contact.id}`);
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    return value < 0 ? `-${formatted}` : formatted;
  };

  const getTypeIcon = (type: string): React.ReactElement | undefined => {
    switch (type) {
      case CONTACT_TYPES.CUSTOMER:
        return <CustomerIcon fontSize="small" />;
      case CONTACT_TYPES.SUPPLIER:
        return <SupplierIcon fontSize="small" />;
      case CONTACT_TYPES.BOTH:
        return <BothIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  const hasActiveFilters = search || typeFilter !== 'all' || balanceFilter !== 'all';

  // Define table columns for ResponsiveTable
  const columns = [
    {
      id: 'name',
      label: 'Name',
      render: (contact: Contact) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {contact.name}
          </Typography>
          {contact.address && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {contact.address}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      render: (contact: Contact) => <Typography variant="body2">{contact.phone}</Typography>,
    },
    {
      id: 'type',
      label: 'Type',
      render: (contact: Contact) => (
        <Chip
          icon={getTypeIcon(contact.type)}
          label={contact.type}
          size="small"
          color={
            contact.type === CONTACT_TYPES.CUSTOMER
              ? 'primary'
              : contact.type === CONTACT_TYPES.SUPPLIER
              ? 'secondary'
              : 'default'
          }
          variant="outlined"
        />
      ),
    },
    {
      id: 'gstin',
      label: 'GSTIN',
      render: (contact: Contact) => (
        <Typography variant="body2" color="text.secondary">
          {contact.gstin || '-'}
        </Typography>
      ),
      hideOnMobile: true,
    },
    {
      id: 'balance',
      label: 'Balance',
      align: 'right' as const,
      render: (contact: Contact) => (
        <Chip
          label={formatCurrency(contact.balance)}
          size="small"
          color={
            contact.balance > 0
              ? 'success'
              : contact.balance < 0
              ? 'error'
              : 'default'
          }
          variant={contact.balance !== 0 ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (contact: Contact) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleViewContact(contact);
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditDialog(contact);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDeleteDialog(contact);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Render content for the table area
  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading contacts..." />;
    }
    
    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }
    
    if (!contacts || contacts.length === 0) {
      return (
        <EmptyState
          title="No contacts found"
          message={hasActiveFilters ? 'Try different filters' : 'Add your first contact to get started'}
          actionLabel={!hasActiveFilters ? 'Add Contact' : undefined}
          onAction={!hasActiveFilters ? handleOpenCreateDialog : undefined}
        />
      );
    }
    
    return (
      <ResponsiveTable
        columns={columns}
        data={contacts}
        keyExtractor={(contact) => contact.id.toString()}
        onRowClick={handleViewContact}
        emptyMessage="No contacts found"
      />
    );
  };

  return (
    <Box>
      <PageHeader
        title="Contacts"
        subtitle={contacts ? `${contacts.length} contacts` : 'Manage your customers and suppliers'}
        actionLabel="Add Contact"
        onAction={handleOpenCreateDialog}
      />

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
            placeholder="Search by name or phone..."
          />
        </Box>
        
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_, value) => value && setTypeFilter(value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'initial' } }}>All</ToggleButton>
          <ToggleButton value={CONTACT_TYPES.CUSTOMER} sx={{ flex: { xs: 1, sm: 'initial' } }}>Customers</ToggleButton>
          <ToggleButton value={CONTACT_TYPES.SUPPLIER} sx={{ flex: { xs: 1, sm: 'initial' } }}>Suppliers</ToggleButton>
          <ToggleButton value={CONTACT_TYPES.BOTH} sx={{ flex: { xs: 1, sm: 'initial' } }}>Both</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={balanceFilter}
          exclusive
          onChange={(_, value) => value && setBalanceFilter(value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <ToggleButton value="all" sx={{ flex: { xs: 1, sm: 'initial' } }}>All</ToggleButton>
          <ToggleButton value="positive" sx={{ flex: { xs: 1, sm: 'initial' } }}>Receivables</ToggleButton>
          <ToggleButton value="negative" sx={{ flex: { xs: 1, sm: 'initial' } }}>Payables</ToggleButton>
        </ToggleButtonGroup>
        
        {isFetching && !showFullLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Searching...
          </Typography>
        )}
      </Stack>

      {/* Contacts table */}
      <Card>
        {renderTableContent()}
      </Card>

      {/* Create/Edit Dialog */}
      <ContactFormDialog
        open={formDialogOpen}
        contact={selectedContact}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleFormSubmit}
        onClose={handleCloseFormDialog}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contact"
        message={`Are you sure you want to delete "${contactToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </Box>
  );
};

export default ContactsPage;
