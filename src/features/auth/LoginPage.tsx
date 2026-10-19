import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Package, CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '../../hooks/useAuth';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        navigate('/dashboard');
      },
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Subtle kraft-paper texture behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain opacity-70"
      />

      <div className="relative w-full max-w-[26rem] space-y-6">
        {/* Brand mark — mirrors the sidebar identity. */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Package className="size-6" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Kraft Culture</p>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Inventory &amp; Billing
            </p>
          </div>
        </div>

        <Card className="py-0">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to continue to your workspace.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-5">
                <CircleAlert />
                <AlertDescription>
                  {(error as { message?: string }).message ||
                    'Login failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  {...register('username')}
                  aria-invalid={!!errors.username}
                  disabled={isPending}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    disabled={isPending}
                    className="pr-10"
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
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Kraft Culture &middot; Internal stock &amp; billing system
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
