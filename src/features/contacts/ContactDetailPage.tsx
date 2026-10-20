import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Phone as PhoneIcon,
  MapPin as LocationIcon,
  Receipt as GstinIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from 'cn';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ContactFormDialog } from './components/ContactFormDialog';
import { ContactBills } from './components/ContactBills';
import { useContact, useUpdateContact, useDeleteContact } from '../../hooks/useContacts';
import { CONTACT_TYPES } from '../../constants';
import type { CreateContactDto, UpdateContactDto } from '../../types';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = parseInt(id || '0', 10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Data fetching
  const { data: contact, isLoading, isError, refetch } = useContact(contactId);

  // Mutations
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = `₹${absValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    return value < 0 ? `-${formatted}` : formatted;
  };

  // Tint standing in for the MUI chip `color` prop on contact type.
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

      <div className="space-y-5">
        {/* Action buttons */}
        <div className="flex items-center gap-1">
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
                className="ml-auto"
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

        <div className="grid grid-cols-12 gap-5">
          {/* Contact Info Card */}
          <div className="col-span-12 md:col-span-6">
            <Card className="h-full">
              <CardContent>
                <h3 className="text-base font-semibold">Contact Information</h3>
                <Separator className="my-4" />

                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Phone
                      </span>
                      <p className="text-sm tabular-nums">{contact.phone}</p>
                    </div>
                  </div>

                  {contact.address && (
                    <div className="flex items-start gap-3">
                      <LocationIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Address
                        </span>
                        <p className="text-sm">{contact.address}</p>
                      </div>
                    </div>
                  )}

                  {contact.gstin && (
                    <div className="flex items-start gap-3">
                      <GstinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          GSTIN
                        </span>
                        <p className="font-mono text-sm tabular-nums">{contact.gstin}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Card */}
          <div className="col-span-12 md:col-span-6">
            <Card className="h-full">
              <CardContent>
                <h3 className="text-base font-semibold">Account Summary</h3>
                <Separator className="my-4" />

                <div className="flex flex-col gap-5">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Contact Type
                    </span>
                    <div className="mt-1.5">
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getTypeBadgeClass(contact.type))}
                      >
                        {contact.type}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Current Balance
                    </span>
                    <p
                      className={cn(
                        'mt-1.5 text-2xl font-semibold tabular-nums',
                        contact.balance > 0
                          ? 'text-success'
                          : contact.balance < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {formatCurrency(contact.balance)}
                    </p>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {contact.balance > 0
                        ? 'They owe you this amount'
                        : contact.balance < 0
                        ? 'You owe them this amount'
                        : 'No outstanding accounting balance'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12">
            <ContactBills key={contactId} contactId={contactId} contactName={contact.name} />
          </div>
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
