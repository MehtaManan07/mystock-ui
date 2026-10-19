import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import {
  Pencil,
  Trash2,
  Eye,
  User as CustomerIcon,
  Truck as SupplierIcon,
  ArrowLeftRight as BothIcon,
  Loader2,
  Plus,
  SearchX,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { ContactFormDialog } from './components/ContactFormDialog';
import { useContactsInfinite, useCreateContact, useUpdateContact, useDeleteContact } from '../../hooks/useContacts';
import { CONTACT_TYPES, type ContactType } from '../../constants';
import type { Contact, CreateContactDto, UpdateContactDto, ContactFilters } from '../../types';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Filter states – synced with URL query params
  const [search, setSearch] = useUrlParam('q');
  const [typeFilter, setTypeFilter] = useUrlParam('type', 'all');
  const [balanceFilter, setBalanceFilter] = useUrlParam('balance', 'all');
  
  // Build filters
  const filters: ContactFilters = {
    search: search || undefined,
    types: typeFilter !== 'all' ? [typeFilter as ContactType] : undefined,
    balance: balanceFilter !== 'all' ? (balanceFilter as 'positive' | 'negative') : undefined,
  };
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

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
  } = useContactsInfinite(filters);

  // Flatten all pages into single array for rendering
  const contacts = data?.pages ? data.pages.flatMap((page) => page?.items ?? []) : [];
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
        return <CustomerIcon />;
      case CONTACT_TYPES.SUPPLIER:
        return <SupplierIcon />;
      case CONTACT_TYPES.BOTH:
        return <BothIcon />;
      default:
        return undefined;
    }
  };

  // Outlined badge tints standing in for the MUI chip `color` prop.
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case CONTACT_TYPES.CUSTOMER:
        return 'border-primary/30 bg-primary/10 text-primary';
      case CONTACT_TYPES.SUPPLIER:
        return 'border-info/30 bg-info/10 text-info';
      default:
        return 'border-border bg-muted text-muted-foreground';
    }
  };

  // Positive balance = they owe us (to collect), negative = we owe them (to pay).
  const getBalanceToneClass = (balance: number) => {
    if (balance > 0) return 'text-success';
    if (balance < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const hasActiveFilters = search || typeFilter !== 'all' || balanceFilter !== 'all';

  // Define table columns for ResponsiveTable
  const columns = [
    {
      id: 'name',
      label: 'Name',
      render: (contact: Contact) => (
        <div className="min-w-0 max-w-[260px]">
          <p className="truncate text-sm font-semibold">{contact.name}</p>
          {contact.address && (
            <span className="block truncate text-xs text-muted-foreground">
              {contact.address}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      render: (contact: Contact) => (
        <span className="text-sm tabular-nums">{contact.phone}</span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (contact: Contact) => (
        <Badge variant="outline" className={cn('capitalize', getTypeBadgeClass(contact.type))}>
          {getTypeIcon(contact.type)}
          {contact.type}
        </Badge>
      ),
    },
    {
      id: 'gstin',
      label: 'GSTIN',
      render: (contact: Contact) => (
        <span className="font-mono text-xs tracking-tight text-muted-foreground tabular-nums">
          {contact.gstin || '—'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      id: 'balance',
      label: 'Balance',
      numeric: true,
      render: (contact: Contact) => (
        <div className="flex flex-col items-end leading-tight">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              getBalanceToneClass(contact.balance)
            )}
          >
            {formatCurrency(contact.balance)}
          </span>
          {contact.balance !== 0 && (
            <span className="text-[0.7rem] text-muted-foreground">
              {contact.balance > 0 ? 'to collect' : 'to pay'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (contact: Contact) => (
        <div className="flex justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="View" asChild>
                <a
                  href={`/contacts/${contact.id}`}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault();
                      handleViewContact(contact);
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
                aria-label="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditDialog(contact);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteDialog(contact);
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
          icon={hasActiveFilters ? <SearchX /> : <Users />}
          title={hasActiveFilters ? 'No matching contacts' : 'No contacts yet'}
          message={
            hasActiveFilters
              ? 'No contact matches the current search and filters. Try widening them.'
              : 'Add your customers and suppliers to track balances and transactions.'
          }
          actionLabel={!hasActiveFilters ? 'Add contact' : undefined}
          actionIcon={!hasActiveFilters ? <Plus /> : undefined}
          onAction={!hasActiveFilters ? handleOpenCreateDialog : undefined}
        />
      );
    }

    return (
      <>
        <ResponsiveTable
          columns={columns}
          data={contacts}
          keyExtractor={(contact) => contact.id.toString()}
          onRowClick={handleViewContact}
          getRowHref={(contact) => `/contacts/${contact.id}`}
          emptyIcon={<Users />}
          emptyTitle="No contacts yet"
          emptyMessage="Add your customers and suppliers to track balances and transactions."
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="border-t border-border/70 p-4 text-center">
          <div ref={observerTarget} className="h-5" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span className="text-sm">Loading more contacts...</span>
            </div>
          )}
          {!hasNextPage && contacts.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              All contacts loaded ({totalCount} total)
            </span>
          )}
        </div>
      </>
    );
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={totalCount > 0 ? `${totalCount} contacts (showing ${contacts.length})` : 'Manage your customers and suppliers'}
        actionLabel="Add Contact"
        onAction={handleOpenCreateDialog}
      />

      <div className="space-y-5">
        {/* Toolbar: search + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or phone..."
            className="sm:max-w-xs"
          />

          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <ToggleGroup
              type="single"
              value={typeFilter}
              onValueChange={(value) => value && setTypeFilter(value)}
              variant="outline"
              size="sm"
              className="w-full sm:w-fit"
            >
              <ToggleGroupItem value="all" className="flex-1 sm:flex-initial">All</ToggleGroupItem>
              <ToggleGroupItem value={CONTACT_TYPES.CUSTOMER} className="flex-1 sm:flex-initial">Customers</ToggleGroupItem>
              <ToggleGroupItem value={CONTACT_TYPES.SUPPLIER} className="flex-1 sm:flex-initial">Suppliers</ToggleGroupItem>
              <ToggleGroupItem value={CONTACT_TYPES.BOTH} className="flex-1 sm:flex-initial">Both</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={balanceFilter}
              onValueChange={(value) => value && setBalanceFilter(value)}
              variant="outline"
              size="sm"
              className="w-full sm:w-fit"
            >
              <ToggleGroupItem value="all" className="flex-1 sm:flex-initial">All</ToggleGroupItem>
              <ToggleGroupItem value="positive" className="flex-1 sm:flex-initial">Receivables</ToggleGroupItem>
              <ToggleGroupItem value="negative" className="flex-1 sm:flex-initial">Payables</ToggleGroupItem>
            </ToggleGroup>

            {isFetching && !isFetchingNextPage && !showFullLoading && (
              <span className="text-xs text-muted-foreground">Searching...</span>
            )}
          </div>
        </div>

        {/* Contacts table */}
        <Card className="gap-0 overflow-hidden py-0">
          {renderTableContent()}
        </Card>
      </div>

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
    </div>
  );
};

export default ContactsPage;
