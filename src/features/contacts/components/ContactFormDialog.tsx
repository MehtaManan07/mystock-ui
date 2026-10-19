import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CONTACT_TYPES, type ContactType } from '../../../constants';
import type { Contact, CreateContactDto } from '../../../types';

// Form data type
interface ContactFormData {
  name: string;
  phone: string;
  address: string;
  gstin: string;
  type: ContactType;
  balance: string;
}

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().min(1, 'Phone is required').max(50),
  address: z.string().max(500),
  gstin: z.string().max(15),
  type: z.enum([CONTACT_TYPES.CUSTOMER, CONTACT_TYPES.SUPPLIER, CONTACT_TYPES.BOTH]),
  balance: z.string(),
});

interface ContactFormDialogProps {
  open: boolean;
  contact?: Contact | null;
  isLoading?: boolean;
  onSubmit: (data: CreateContactDto) => void;
  onClose: () => void;
}

const contactTypeOptions: { value: ContactType; label: string; description: string }[] = [
  { value: CONTACT_TYPES.CUSTOMER, label: 'Customer', description: 'Buys from you' },
  { value: CONTACT_TYPES.SUPPLIER, label: 'Supplier', description: 'Sells to you' },
  { value: CONTACT_TYPES.BOTH, label: 'Both', description: 'Customer & Supplier' },
];

export const ContactFormDialog: React.FC<ContactFormDialogProps> = ({
  open,
  contact,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const isEditing = !!contact;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      gstin: '',
      type: CONTACT_TYPES.CUSTOMER,
      balance: '0',
    },
  });

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open) {
      if (contact) {
        reset({
          name: contact.name,
          phone: contact.phone,
          address: contact.address || '',
          gstin: contact.gstin || '',
          type: contact.type as ContactType,
          balance: contact.balance.toString(),
        });
      } else {
        reset({
          name: '',
          phone: '',
          address: '',
          gstin: '',
          type: CONTACT_TYPES.CUSTOMER,
          balance: '0',
        });
      }
    }
  }, [open, contact, reset]);

  const handleFormSubmit = (data: ContactFormData) => {
    const balanceValue = data.balance ? parseFloat(data.balance) : 0;
    
    onSubmit({
      name: data.name,
      phone: data.phone,
      address: data.address || undefined,
      gstin: data.gstin || undefined,
      type: data.type,
      balance: balanceValue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-12 gap-4 pt-1">
            <div className="col-span-12 grid gap-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                {...register('name')}
                placeholder="Contact or business name"
                aria-invalid={!!errors.name}
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2 sm:col-span-6">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                className="tabular-nums"
                {...register('phone')}
                placeholder="e.g., 9876543210"
                aria-invalid={!!errors.phone}
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2 sm:col-span-6">
              <Label htmlFor="contact-type">Contact Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="contact-type"
                      className="w-full"
                      aria-invalid={!!errors.type}
                    >
                      <SelectValue placeholder="Contact Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2">
              <Label htmlFor="contact-address">Address (Optional)</Label>
              <Textarea
                id="contact-address"
                {...register('address')}
                placeholder="Full address"
                rows={2}
                aria-invalid={!!errors.address}
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2 sm:col-span-6">
              <Label htmlFor="contact-gstin">GSTIN (Optional)</Label>
              <Input
                id="contact-gstin"
                className="font-mono tabular-nums uppercase"
                {...register('gstin')}
                placeholder="e.g., 22AAAAA0000A1Z5"
                aria-invalid={!!errors.gstin}
                disabled={isLoading}
              />
              {errors.gstin && (
                <p className="text-sm text-destructive">{errors.gstin.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2 sm:col-span-6">
              <Label htmlFor="contact-balance">Opening Balance</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="contact-balance"
                  {...register('balance')}
                  type="number"
                  step="0.01"
                  className="pl-7 tabular-nums"
                  aria-invalid={!!errors.balance}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-success">Positive</span> = they owe you ·{' '}
                <span className="font-medium text-destructive">Negative</span> = you owe them
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
