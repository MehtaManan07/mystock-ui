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
        return 'border-primary/50 text-primary';
      case CONTACT_TYPES.SUPPLIER:
        return 'border-secondary-foreground/40 text-secondary-foreground';
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
        <div>
          <p className="text-sm font-semibold">{contact.name}</p>
          {contact.address && (
            <span className="block text-xs text-muted-foreground">
              {contact.address}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      render: (contact: Contact) => <p className="text-sm">{contact.phone}</p>,
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
        <p className="text-sm text-muted-foreground">{contact.gstin || '-'}</p>
      ),
      hideOnMobile: true,
    },
    {
      id: 'balance',
      label: 'Balance',
      align: 'right' as const,
      render: (contact: Contact) => (
        <Badge
          variant={
            contact.balance < 0 ? 'destructive' : contact.balance > 0 ? 'default' : 'outline'
          }
          className={cn(contact.balance > 0 && 'bg-success text-success-foreground')}
        >
          {formatCurrency(contact.balance)}
        </Badge>
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
          title="No contacts found"
          message={hasActiveFilters ? 'Try different filters' : 'Add your first contact to get started'}
          actionLabel={!hasActiveFilters ? 'Add Contact' : undefined}
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
          emptyMessage="No contacts found"
        />

        {/* Infinite scroll trigger and loading indicator */}
        <div className="p-4 text-center">
          <div ref={observerTarget} style={{ height: '20px' }} />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading more contacts...</p>
            </div>
          )}
          {!hasNextPage && contacts.length > 0 && (
            <span className="text-xs text-muted-foreground">
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

      {/* Filters - responsive */}
      <div className="mb-4 flex flex-col flex-wrap gap-4 sm:mb-6 sm:flex-row">
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or phone..."
          />
        </div>
        
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
          <span className="self-center text-xs text-muted-foreground">Searching...</span>
        )}
      </div>

      {/* Contacts table */}
      <Card className="gap-0 overflow-hidden py-0">
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
    </div>
  );
};

export default ContactsPage;
