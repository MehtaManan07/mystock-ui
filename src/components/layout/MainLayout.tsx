import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  Receipt,
  FileText,
  Wallet,
  Moon,
  Sun,
  LogOut,
  User,
  Boxes,
  UserCog,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useLogout } from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants';

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <LayoutDashboard />, path: '/dashboard' },
  { text: 'Products', icon: <Package />, path: '/products' },
  { text: 'Containers', icon: <Warehouse />, path: '/containers' },
  { text: 'Inventory', icon: <Boxes />, path: '/inventory' },
  { text: 'Contacts', icon: <Users />, path: '/contacts' },
  { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
  { text: 'PDF Bills', icon: <FileText />, path: '/pdf-invoices' },
  { text: 'Assistant', icon: <Sparkles />, path: '/assistant' },
  { text: 'Payments', icon: <Wallet />, path: '/payments' },
  { text: 'Users', icon: <UserCog />, path: '/users', adminOnly: true },
];

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { mode, toggleTheme } = useThemeStore();
  const logout = useLogout();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 sm:p-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-chart-1 to-chart-2">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-lg font-bold text-primary">Kraft Culture</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 sm:px-4">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === USER_ROLES.ADMIN)
          .map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <a
                key={item.text}
                href={item.path}
                onClick={(e) => {
                  // Let the browser handle modified clicks so "open in new tab" works.
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    handleNavClick(item.path);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  '[&_svg]:size-5 [&_svg]:shrink-0',
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                {item.icon}
                {item.text}
              </a>
            );
          })}
      </nav>

      <Separator />

      {/* User info at bottom */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-sm text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.role || 'Role'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-65 border-r md:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-65 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-4 sm:h-16 md:left-65">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {mode === 'dark' ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <Avatar className="size-8 sm:size-9">
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content */}
      <main className="mt-14 p-4 sm:mt-16 sm:p-6 md:ml-65">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
