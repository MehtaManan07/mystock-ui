import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';

// Form data type
interface SettingsFormData {
  company_name: string;
  seller_name: string;
  seller_phone: string;
  seller_email: string;
  seller_gstin: string;
  company_address_line1: string;
  company_address_line2: string;
  company_address_line3: string;
  hsn_code: string;
  terms_and_conditions: string;
  bank_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_ifsc: string;
}

// Validation schema
const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  seller_name: z.string().min(1, 'Seller name is required').max(255),
  seller_phone: z.string().min(1, 'Phone is required').max(50),
  seller_email: z.string().email('Invalid email').max(255),
  seller_gstin: z.string().max(15),
  company_address_line1: z.string().max(255),
  company_address_line2: z.string().max(255),
  company_address_line3: z.string().max(255),
  hsn_code: z.string().max(15),
  terms_and_conditions: z.string(),
  bank_name: z.string().trim().max(255),
  bank_account_number: z.string().trim().max(50).regex(/^[0-9]*$/, 'Use digits only'),
  bank_branch: z.string().trim().max(255),
  bank_ifsc: z.string().trim().toUpperCase().regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/, 'Enter a valid 11-character IFSC'),
}).superRefine((data, context) => {
  if (data.bank_name || data.bank_account_number || data.bank_branch || data.bank_ifsc) {
    for (const field of ['bank_name', 'bank_account_number', 'bank_ifsc'] as const) {
      if (!data[field]) {
        context.addIssue({ code: 'custom', path: [field], message: 'Required when bank details are provided' });
      }
    }
  }
});

interface FieldProps {
  id: keyof SettingsFormData;
  label: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, label, error, helperText, children }) => (
  <div className="grid gap-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {error ? (
      <p className="text-sm text-destructive">{error}</p>
    ) : (
      helperText && <p className="text-xs text-muted-foreground">{helperText}</p>
    )}
  </div>
);

export const SettingsPage: React.FC = () => {
  // Data fetching
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateMutation = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: '',
      seller_name: '',
      seller_phone: '',
      seller_email: '',
      seller_gstin: '',
      company_address_line1: '',
      company_address_line2: '',
      company_address_line3: '',
      hsn_code: '44111200',
      terms_and_conditions: '',
      bank_name: '',
      bank_account_number: '',
      bank_branch: '',
      bank_ifsc: '',
    },
  });

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      reset({
        company_name: settings.company_name,
        seller_name: settings.seller_name,
        seller_phone: settings.seller_phone,
        seller_email: settings.seller_email,
        seller_gstin: settings.seller_gstin,
        company_address_line1: settings.company_address_line1,
        company_address_line2: settings.company_address_line2,
        company_address_line3: settings.company_address_line3,
        hsn_code: settings.hsn_code,
        terms_and_conditions: settings.terms_and_conditions,
        bank_name: settings.bank_name ?? '',
        bank_account_number: settings.bank_account_number ?? '',
        bank_branch: settings.bank_branch ?? '',
        bank_ifsc: settings.bank_ifsc ?? '',
      });
    }
  }, [settings, reset]);

  const handleFormSubmit = (data: SettingsFormData) => {
    updateMutation.mutate({
      ...data,
      bank_name: data.bank_name || null,
      bank_account_number: data.bank_account_number || null,
      bank_branch: data.bank_branch || null,
      bank_ifsc: data.bank_ifsc || null,
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading settings..." fullPage />;
  }

  if (isError || !settings) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Company Settings"
        subtitle="Details used across invoices, PDF bills and customer documents."
      />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Company information
            </CardTitle>
            <CardDescription>
              The registered name and address printed at the top of every invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Field id="company_name" label="Company name" error={errors.company_name?.message}>
              <Input
                id="company_name"
                {...register('company_name')}
                aria-invalid={!!errors.company_name}
              />
            </Field>
            <Field
              id="company_address_line1"
              label="Address line 1"
              error={errors.company_address_line1?.message}
            >
              <Input
                id="company_address_line1"
                {...register('company_address_line1')}
                aria-invalid={!!errors.company_address_line1}
              />
            </Field>
            <Field
              id="company_address_line2"
              label="Address line 2"
              error={errors.company_address_line2?.message}
            >
              <Input
                id="company_address_line2"
                {...register('company_address_line2')}
                aria-invalid={!!errors.company_address_line2}
              />
            </Field>
            <Field
              id="company_address_line3"
              label="Address line 3"
              error={errors.company_address_line3?.message}
            >
              <Input
                id="company_address_line3"
                {...register('company_address_line3')}
                aria-invalid={!!errors.company_address_line3}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Seller &amp; tax identity
            </CardTitle>
            <CardDescription>
              Contact details and GSTIN shown to customers on tax invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="seller_name" label="Seller name" error={errors.seller_name?.message}>
              <Input
                id="seller_name"
                {...register('seller_name')}
                aria-invalid={!!errors.seller_name}
              />
            </Field>
            <Field id="seller_phone" label="Phone" error={errors.seller_phone?.message}>
              <Input
                id="seller_phone"
                className="tabular-nums"
                {...register('seller_phone')}
                aria-invalid={!!errors.seller_phone}
              />
            </Field>
            <Field id="seller_email" label="Email" error={errors.seller_email?.message}>
              <Input
                id="seller_email"
                type="email"
                {...register('seller_email')}
                aria-invalid={!!errors.seller_email}
              />
            </Field>
            <Field
              id="seller_gstin"
              label="GSTIN"
              error={errors.seller_gstin?.message}
              helperText="15-character GST identification number."
            >
              <Input
                id="seller_gstin"
                className="tabular-nums uppercase"
                {...register('seller_gstin')}
                aria-invalid={!!errors.seller_gstin}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Invoice defaults</CardTitle>
            <CardDescription>
              Applied to newly generated invoices. Existing archived PDFs are not changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <Field
              id="hsn_code"
              label="HSN code"
              error={errors.hsn_code?.message}
              helperText="Harmonized System of Nomenclature code for products."
            >
              <Input
                id="hsn_code"
                className="tabular-nums sm:max-w-xs"
                {...register('hsn_code')}
                aria-invalid={!!errors.hsn_code}
              />
            </Field>
            <Field
              id="terms_and_conditions"
              label="Terms and conditions"
              error={errors.terms_and_conditions?.message}
              helperText="Appears at the bottom of every invoice."
            >
              <Textarea
                id="terms_and_conditions"
                rows={4}
                {...register('terms_and_conditions')}
                aria-invalid={!!errors.terms_and_conditions}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Bank details</CardTitle>
            <CardDescription>
              Printed on newly generated invoices so customers can pay by transfer.
              Leave every field blank to omit bank details entirely.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="bank_name" label="Bank name" error={errors.bank_name?.message}>
              <Input
                id="bank_name"
                {...register('bank_name')}
                aria-invalid={!!errors.bank_name}
              />
            </Field>
            <Field
              id="bank_account_number"
              label="Account number"
              error={errors.bank_account_number?.message}
            >
              <Input
                id="bank_account_number"
                className="tabular-nums"
                {...register('bank_account_number')}
                aria-invalid={!!errors.bank_account_number}
              />
            </Field>
            <Field
              id="bank_branch"
              label="Branch / code"
              error={errors.bank_branch?.message}
              helperText="Optional."
            >
              <Input
                id="bank_branch"
                {...register('bank_branch')}
                aria-invalid={!!errors.bank_branch}
              />
            </Field>
            <Field
              id="bank_ifsc"
              label="IFSC"
              error={errors.bank_ifsc?.message}
              helperText="11 characters, e.g. HDFC0001234."
            >
              <Input
                id="bank_ifsc"
                className="tabular-nums uppercase"
                {...register('bank_ifsc')}
                aria-invalid={!!errors.bank_ifsc}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty || updateMutation.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
