import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import type { UpdateCompanySettingsDto } from '../../types';

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
});

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
      });
    }
  }, [settings, reset]);

  const handleFormSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data as UpdateCompanySettingsDto);
  };

  if (isLoading) {
    return <LoadingState message="Loading settings..." fullPage />;
  }

  if (isError || !settings) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <Box>
      <PageHeader
        title="Company Settings"
        subtitle="Manage your company information and invoice settings"
      />

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Grid container spacing={3}>
          {/* Company Information */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Company Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      {...register('company_name')}
                      label="Company Name"
                      error={!!errors.company_name}
                      helperText={errors.company_name?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      {...register('company_address_line1')}
                      label="Address Line 1"
                      error={!!errors.company_address_line1}
                      helperText={errors.company_address_line1?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      {...register('company_address_line2')}
                      label="Address Line 2"
                      error={!!errors.company_address_line2}
                      helperText={errors.company_address_line2?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      {...register('company_address_line3')}
                      label="Address Line 3"
                      error={!!errors.company_address_line3}
                      helperText={errors.company_address_line3?.message}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Seller Information */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Seller Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('seller_name')}
                      label="Seller Name"
                      error={!!errors.seller_name}
                      helperText={errors.seller_name?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('seller_phone')}
                      label="Phone"
                      error={!!errors.seller_phone}
                      helperText={errors.seller_phone?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('seller_email')}
                      label="Email"
                      type="email"
                      error={!!errors.seller_email}
                      helperText={errors.seller_email?.message}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      {...register('seller_gstin')}
                      label="GSTIN"
                      error={!!errors.seller_gstin}
                      helperText={errors.seller_gstin?.message}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice Settings */}
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      {...register('hsn_code')}
                      label="HSN Code"
                      error={!!errors.hsn_code}
                      helperText={errors.hsn_code?.message || 'Harmonized System of Nomenclature code for products'}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      {...register('terms_and_conditions')}
                      label="Terms and Conditions"
                      error={!!errors.terms_and_conditions}
                      helperText={errors.terms_and_conditions?.message || 'Appears at the bottom of invoices'}
                      multiline
                      rows={4}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => reset()}
                disabled={!isDirty || updateMutation.isPending}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default SettingsPage;
