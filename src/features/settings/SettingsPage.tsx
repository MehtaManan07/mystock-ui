import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
      helperText && <p className="text-sm text-muted-foreground">{helperText}</p>
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
    <div>
      <PageHeader
        title="Company Settings"
        subtitle="Manage your company information and invoice settings"
      />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6">
        {/* Company Information */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold">Company Information</h3>
            <Separator className="mt-2 mb-6" />
            <div className="grid grid-cols-1 gap-4">
              <Field id="company_name" label="Company Name" error={errors.company_name?.message}>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  aria-invalid={!!errors.company_name}
                />
              </Field>
              <Field
                id="company_address_line1"
                label="Address Line 1"
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
                label="Address Line 2"
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
                label="Address Line 3"
                error={errors.company_address_line3?.message}
              >
                <Input
                  id="company_address_line3"
                  {...register('company_address_line3')}
                  aria-invalid={!!errors.company_address_line3}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Seller Information */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold">Seller Information</h3>
            <Separator className="mt-2 mb-6" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="seller_name" label="Seller Name" error={errors.seller_name?.message}>
                <Input
                  id="seller_name"
                  {...register('seller_name')}
                  aria-invalid={!!errors.seller_name}
                />
              </Field>
              <Field id="seller_phone" label="Phone" error={errors.seller_phone?.message}>
                <Input
                  id="seller_phone"
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
              <Field id="seller_gstin" label="GSTIN" error={errors.seller_gstin?.message}>
                <Input
                  id="seller_gstin"
                  {...register('seller_gstin')}
                  aria-invalid={!!errors.seller_gstin}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold">Invoice Settings</h3>
            <Separator className="mt-2 mb-6" />
            <div className="grid grid-cols-1 gap-4">
              <Field
                id="hsn_code"
                label="HSN Code"
                error={errors.hsn_code?.message}
                helperText="Harmonized System of Nomenclature code for products"
              >
                <Input
                  id="hsn_code"
                  {...register('hsn_code')}
                  aria-invalid={!!errors.hsn_code}
                />
              </Field>
              <Field
                id="terms_and_conditions"
                label="Terms and Conditions"
                error={errors.terms_and_conditions?.message}
                helperText="Appears at the bottom of invoices"
              >
                <Textarea
                  id="terms_and_conditions"
                  rows={4}
                  {...register('terms_and_conditions')}
                  aria-invalid={!!errors.terms_and_conditions}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Company Bank Details */}
        <Card>
          <CardContent>
            <h3 className="text-base font-semibold">Company Bank Details</h3>
            <p className="mt-2 mb-4 text-sm text-muted-foreground">
              Printed on newly generated invoices. Existing archived PDFs are not changed.
              Leave all fields blank to omit bank details.
            </p>
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="bank_name" label="Bank Name" error={errors.bank_name?.message}>
                <Input
                  id="bank_name"
                  {...register('bank_name')}
                  aria-invalid={!!errors.bank_name}
                />
              </Field>
              <Field
                id="bank_account_number"
                label="Account Number"
                error={errors.bank_account_number?.message}
              >
                <Input
                  id="bank_account_number"
                  {...register('bank_account_number')}
                  aria-invalid={!!errors.bank_account_number}
                />
              </Field>
              <Field
                id="bank_branch"
                label="Branch / Code (optional)"
                error={errors.bank_branch?.message}
              >
                <Input
                  id="bank_branch"
                  {...register('bank_branch')}
                  aria-invalid={!!errors.bank_branch}
                />
              </Field>
              <Field id="bank_ifsc" label="IFSC" error={errors.bank_ifsc?.message}>
                <Input
                  id="bank_ifsc"
                  {...register('bank_ifsc')}
                  aria-invalid={!!errors.bank_ifsc}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty || updateMutation.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
