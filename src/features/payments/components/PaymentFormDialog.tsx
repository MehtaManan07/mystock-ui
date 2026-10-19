import React, { useEffect, useState } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { cn } from 'cn';
import { useForm, Controller } from 'react-hook-form';
import { useCreatePayment, useUpdatePayment, usePaymentCategories } from '../../../hooks/usePayments';
import { useContacts } from '../../../hooks/useContacts';
import { PAYMENT_METHODS, PAYMENT_TYPES, type PaymentType, type PaymentMethod } from '../../../constants';
import type { Contact, Payment, CreatePaymentDto } from '../../../types';

interface PaymentFormDialogProps {
  open: boolean;
  payment: Payment | null;
  onClose: () => void;
}

interface FormData {
  payment_date: string;
  type: PaymentType;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  contact_id: number | null;
  description: string;
  reference_number: string;
}

/**
 * Free-text combobox replacing MUI's `freeSolo` Autocomplete: typing in the
 * command input writes straight through to the field, selecting an option
 * replaces it.
 */
const CategoryCombobox: React.FC<{
  value: string;
  options: string[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || 'Select or type category'}
          </span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Select or type category"
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            <CommandEmpty>No matching category — your text is kept.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {option}
                  <Check className={cn('ml-auto', value === option ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ContactCombobox: React.FC<{
  value: number | null;
  contacts: Contact[];
  onChange: (value: number | null) => void;
}> = ({ value, contacts, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = contacts.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.name : 'Select contact'}
          </span>
          <ChevronDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search contacts..." />
          <CommandList>
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">None</span>
                <Check className={cn('ml-auto', selected === null ? 'opacity-100' : 'opacity-0')} />
              </CommandItem>
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.name}
                  onSelect={() => {
                    onChange(contact.id);
                    setOpen(false);
                  }}
                >
                  {contact.name}
                  <Check
                    className={cn('ml-auto', contact.id === value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const PaymentFormDialog: React.FC<PaymentFormDialogProps> = ({
  open,
  payment,
  onClose,
}) => {
  const isEdit = !!payment;
  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const { data: suggestedCategories } = usePaymentCategories();
  const { data: contacts } = useContacts();

  const [paymentType, setPaymentType] = useState<PaymentType>(PAYMENT_TYPES.EXPENSE);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      type: PAYMENT_TYPES.EXPENSE,
      category: '',
      amount: 0,
      payment_method: PAYMENT_METHODS.CASH,
      contact_id: null,
      description: '',
      reference_number: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (payment) {
        setPaymentType(payment.type);
        reset({
          payment_date: payment.payment_date,
          type: payment.type,
          category: payment.category || '',
          amount: payment.amount,
          payment_method: payment.payment_method,
          contact_id: payment.contact?.id || null,
          description: payment.description || '',
          reference_number: payment.reference_number || '',
        });
      } else {
        setPaymentType(PAYMENT_TYPES.EXPENSE);
        reset({
          payment_date: new Date().toISOString().split('T')[0],
          type: PAYMENT_TYPES.EXPENSE,
          category: '',
          amount: 0,
          payment_method: PAYMENT_METHODS.CASH,
          contact_id: null,
          description: '',
          reference_number: '',
        });
      }
    }
  }, [open, payment, reset]);

  const handleTypeChange = (newType: string) => {
    if (newType) {
      setPaymentType(newType as PaymentType);
    }
  };

  const onSubmit = async (data: FormData) => {
    const payload: CreatePaymentDto = {
      payment_date: data.payment_date,
      type: paymentType,
      category: data.category || undefined,
      amount: data.amount,
      payment_method: data.payment_method,
      contact_id: data.contact_id || undefined,
      description: data.description || undefined,
      reference_number: data.reference_number || undefined,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: payment.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save payment:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Get appropriate categories based on payment type
  const categories =
    paymentType === PAYMENT_TYPES.INCOME
      ? suggestedCategories?.income_categories || []
      : suggestedCategories?.expense_categories || [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
        </DialogHeader>

        <div className="border-y py-4">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-12 gap-4">
              {/* Payment Type Toggle */}
              <div className="col-span-12">
                <div className="mb-2 flex justify-center">
                  <ToggleGroup
                    type="single"
                    value={paymentType}
                    onValueChange={handleTypeChange}
                    variant="outline"
                    size="lg"
                  >
                    <ToggleGroupItem
                      value={PAYMENT_TYPES.INCOME}
                      className="data-[state=on]:bg-success data-[state=on]:text-success-foreground"
                    >
                      <IncomeIcon className="mr-2" />
                      Income
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value={PAYMENT_TYPES.EXPENSE}
                      className="data-[state=on]:bg-destructive data-[state=on]:text-white"
                    >
                      <ExpenseIcon className="mr-2" />
                      Expense
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Payment Date */}
              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  {...register('payment_date', { required: 'Date is required' })}
                  aria-invalid={!!errors.payment_date}
                />
                {errors.payment_date && (
                  <p className="text-sm text-destructive">{errors.payment_date.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="payment-amount">Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    ₹
                  </span>
                  <Input
                    id="payment-amount"
                    type="number"
                    className="pl-7"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: { value: 0.01, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                    aria-invalid={!!errors.amount}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="payment-category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <CategoryCombobox
                      value={field.value}
                      options={categories}
                      onChange={(next) => field.onChange(next)}
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground">
                  You can type your own category
                </p>
              </div>

              {/* Payment Method */}
              <div className="col-span-12 grid gap-2 sm:col-span-6">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Controller
                  name="payment_method"
                  control={control}
                  rules={{ required: 'Payment method is required' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="payment-method"
                        className="w-full capitalize"
                        aria-invalid={!!errors.payment_method}
                      >
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PAYMENT_METHODS).map((method) => (
                          <SelectItem key={method} value={method} className="capitalize">
                            {method.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.payment_method && (
                  <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                )}
              </div>

              {/* Contact */}
              <div className="col-span-12 grid gap-2">
                <Label htmlFor="payment-contact">Contact (Optional)</Label>
                <Controller
                  name="contact_id"
                  control={control}
                  render={({ field }) => (
                    <ContactCombobox
                      value={field.value}
                      contacts={contacts || []}
                      onChange={(next) => field.onChange(next)}
                    />
                  )}
                />
              </div>

              {/* Description */}
              <div className="col-span-12 grid gap-2">
                <Label htmlFor="payment-description">Description</Label>
                <Textarea id="payment-description" rows={2} {...register('description')} />
                <p className="text-sm text-muted-foreground">
                  Brief description of the payment
                </p>
              </div>

              {/* Reference Number */}
              <div className="col-span-12 grid gap-2">
                <Label htmlFor="payment-reference">Reference Number</Label>
                <Input
                  id="payment-reference"
                  {...register('reference_number')}
                  placeholder="e.g., Receipt #, Check #, UPI Transaction ID"
                />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={paymentType === PAYMENT_TYPES.INCOME ? 'default' : 'destructive'}
            className={cn(
              paymentType === PAYMENT_TYPES.INCOME &&
                'bg-success text-success-foreground hover:bg-success/90'
            )}
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : isEdit ? (
              'Update'
            ) : (
              `Add ${paymentType === PAYMENT_TYPES.INCOME ? 'Income' : 'Expense'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
