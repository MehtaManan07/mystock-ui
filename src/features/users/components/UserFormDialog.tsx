import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { USER_ROLES, type UserRole } from '../../../constants';
import type { User, CreateUserDto } from '../../../types';

// Validation schema
const userSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters'),
  password: z.string(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF, USER_ROLES.JOBBER]),
  contact_info: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const roleOptions: { value: UserRole; label: string }[] = [
  { value: USER_ROLES.ADMIN, label: 'Admin' },
  { value: USER_ROLES.MANAGER, label: 'Manager' },
  { value: USER_ROLES.STAFF, label: 'Staff' },
  { value: USER_ROLES.JOBBER, label: 'Jobber' },
];

interface UserFormDialogProps {
  open: boolean;
  user?: User | null;
  isLoading?: boolean;
  onSubmit: (data: CreateUserDto) => void;
  onClose: () => void;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  user,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const isEditing = !!user;
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      name: '',
      role: USER_ROLES.STAFF,
      contact_info: '',
    },
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          username: user.username,
          password: '', // Don't populate password for editing
          name: user.name,
          role: user.role,
          contact_info: user.contact_info || '',
        });
      } else {
        reset({
          username: '',
          password: '',
          name: '',
          role: USER_ROLES.STAFF,
          contact_info: '',
        });
      }
      setShowPassword(false);
    }
  }, [open, user, reset]);

  const handleFormSubmit = (data: UserFormData) => {
    // Validate password for new users
    if (!isEditing && (!data.password || data.password.length < 6)) {
      setError('password', {
        type: 'manual',
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const submitData: CreateUserDto = {
      username: data.username,
      password: data.password,
      name: data.name,
      role: data.role,
      contact_info: data.contact_info || undefined,
    };

    // If editing and password is empty, don't include it
    if (isEditing && !data.password) {
      delete (submitData as Partial<CreateUserDto>).password;
    }

    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                {...register('name')}
                label="Full Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isLoading}
                autoFocus
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('username')}
                label="Username"
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isLoading}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('password')}
                label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select {...field} label="Role" disabled={isLoading}>
                      {roleOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.role && (
                      <FormHelperText>{errors.role.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                {...register('contact_info')}
                label="Contact Info (Optional)"
                placeholder="Phone or email"
                error={!!errors.contact_info}
                helperText={errors.contact_info?.message}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;
