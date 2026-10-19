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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-12 gap-4 pt-1">
            <div className="col-span-12 grid gap-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                {...register('name')}
                aria-invalid={!!errors.name}
                disabled={isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                {...register('username')}
                aria-invalid={!!errors.username}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2">
              <Label htmlFor="user-password">
                {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="user-role"
                      className="w-full"
                      aria-invalid={!!errors.role}
                    >
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="col-span-12 grid gap-2">
              <Label htmlFor="user-contact-info">Contact Info (Optional)</Label>
              <Input
                id="user-contact-info"
                {...register('contact_info')}
                placeholder="Phone or email"
                aria-invalid={!!errors.contact_info}
                disabled={isLoading}
              />
              {errors.contact_info && (
                <p className="text-sm text-destructive">{errors.contact_info.message}</p>
              )}
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

export default UserFormDialog;
