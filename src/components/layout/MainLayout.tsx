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
  Monitor,
  Check,
  LogOut,
  Settings,
  Boxes,
  UserCog,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from 'cn';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore, useResolvedTheme, type ThemeMode } from '../../stores/themeStore';
import { useUiStore } from '../../stores/uiStore';
import { useLogout } from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants';

interface NavItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

/* Grouped so the sidebar reads as a few short lists rather than one long
   undifferentiated column of ten links. */
const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ text: 'Dashboard', icon: <LayoutDashboard />, path: '/dashboard' }],
  },
  {
    label: 'Inventory',
    items: [
      { text: 'Products', icon: <Package />, path: '/products' },
      { text: 'Containers', icon: <Warehouse />, path: '/containers' },
      { text: 'Stock', icon: <Boxes />, path: '/inventory' },
    ],
  },
  {
    label: 'Trade',
    items: [
      { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
      { text: 'Payments', icon: <Wallet />, path: '/payments' },
      { text: 'PDF Bills', icon: <FileText />, path: '/pdf-invoices' },
    ],
  },
  {
    label: 'Directory',
    items: [
      { text: 'Contacts', icon: <Users />, path: '/contacts' },
      { text: 'Users', icon: <UserCog />, path: '/users', adminOnly: true },
    ],
  },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'system', label: 'System', icon: <Monitor /> },
];

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const mode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);
  const resolvedTheme = useResolvedTheme();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
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

  /**
   * `startsWith` alone would light up the wrong entry for sibling routes that
   * share a prefix, so match the exact path or a true sub-path.
   */
  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  /** `isRail` only applies to the desktop sidebar; the mobile sheet is always full. */
  const renderSidebar = (isRail: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border sm:h-16',
          isRail ? 'justify-center px-2' : 'px-4'
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Package className="size-[18px]" />
        </div>
        {!isRail && (
          <span className="truncate text-[15px] font-bold tracking-tight">
            Kraft Culture
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-4">
        {navGroups.map((group, groupIndex) => {
          const items = group.items.filter(
            (item) => !item.adminOnly || user?.role === USER_ROLES.ADMIN
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label ?? `group-${groupIndex}`} className="space-y-1">
              {group.label &&
                (isRail ? (
                  <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
                ) : (
                  <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {group.label}
                  </p>
                ))}

              {items.map((item) => {
                const isActive = isActivePath(item.path);
                const link = (
                  <a
                    key={item.text}
                    href={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      // Let the browser handle modified clicks so "open in new
                      // tab" keeps working.
                      if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        handleNavClick(item.path);
                      }
                    }}
                    className={cn(
                      'relative flex items-center rounded-lg text-sm transition-colors',
                      '[&_svg]:size-[18px] [&_svg]:shrink-0',
                      isRail ? 'justify-center p-2.5' : 'gap-3 px-2.5 py-2',
                      isActive
                        ? 'bg-sidebar-accent font-semibold text-primary'
                        : 'font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {/* Active marker rail, tucked against the sidebar edge. */}
                    {isActive && (
                      <span className="absolute -left-2.5 h-5 w-1 rounded-r-full bg-primary" />
                    )}
                    {item.icon}
                    {!isRail && <span className="truncate">{item.text}</span>}
                  </a>
                );

                return isRail ? (
                  <Tooltip key={item.text}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.text}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-2.5">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-1 py-1.5',
            isRail && 'justify-center'
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          {!isRail && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.role || 'Role'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-65'
        )}
      >
        {renderSidebar(collapsed)}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-65 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {renderSidebar(false)}
        </SheetContent>
      </Sheet>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-1 border-b bg-background/85 px-3 backdrop-blur-sm sm:h-16 sm:px-4',
          'transition-[left] duration-200',
          collapsed ? 'md:left-16' : 'md:left-65'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebar}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              onClick={() => navigate('/assistant')}
              aria-current={isActivePath('/assistant') ? 'page' : undefined}
              className={cn(
                'gap-2 font-semibold',
                isActivePath('/assistant')
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  : 'border border-primary/30 text-primary hover:bg-primary/10 hover:text-primary'
              )}
            >
              <Sparkles />
              <span className="hidden sm:inline">AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open KC AI</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Change theme">
              {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {THEME_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {mode === option.value && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="truncate text-xs font-normal text-muted-foreground capitalize">
                {user?.role}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === USER_ROLES.ADMIN && (
              <>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings />
                  Company settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main
        className={cn(
          'mt-14 p-4 sm:mt-16 sm:p-6 lg:p-8',
          // Height of the header + main padding, so pages that need to fill the
          // viewport can size themselves without re-deriving it per breakpoint.
          '[--app-chrome:88px] sm:[--app-chrome:112px] lg:[--app-chrome:128px]',
          'transition-[margin] duration-200',
          collapsed ? 'md:ml-16' : 'md:ml-65'
        )}
      >
        <div className="mx-auto w-full max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
