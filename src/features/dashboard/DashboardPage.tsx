import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Warehouse,
  Users,
  Receipt,
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowRight,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { cn } from 'cn';
import { useAuthStore } from '../../stores/authStore';
import { useDashboard } from '../../hooks/useDashboard';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  /** Tailwind classes for the icon tile — colours must be static for JIT. */
  accentClassName: string;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  accentClassName,
  loading,
  onClick,
}) => (
  <Card
    onClick={onClick}
    className={cn(
      'gap-0 py-5 transition-all',
      onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
    )}
  >
    <CardContent className="flex items-center gap-4 px-5">
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
          accentClassName
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted-foreground">{title}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

interface FinanceCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentClassName: string;
  valueClassName: string;
  loading?: boolean;
  onClick: () => void;
}

const FinanceCard: React.FC<FinanceCardProps> = ({
  title,
  value,
  icon,
  accentClassName,
  valueClassName,
  loading,
  onClick,
}) => (
  <Card
    onClick={onClick}
    className="cursor-pointer gap-0 py-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
  >
    <CardContent className="px-5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-lg [&_svg]:size-4',
            accentClassName
          )}
        >
          {icon}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-32" />
      ) : (
        <p
          className={cn(
            'mt-4 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl',
            valueClassName
          )}
        >
          {formatCurrency(value)}
        </p>
      )}
    </CardContent>
  </Card>
);

const paymentStatusClass = (status: string) => {
  if (status === 'paid') return 'border-success/30 bg-success/10 text-success';
  if (status === 'partial') return 'border-warning/40 bg-warning/10 text-warning';
  return 'border-destructive/30 bg-destructive/10 text-destructive';
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Fetch all dashboard data in a single API call
  const { data: dashboardData, isLoading } = useDashboard();

  // Extract data with fallbacks
  const totalProducts = dashboardData?.stats.total_products || 0;
  const totalContainers = dashboardData?.stats.total_containers || 0;
  const totalContacts = dashboardData?.stats.total_contacts || 0;
  const totalInventory = dashboardData?.stats.total_inventory || 0;

  // Financial stats
  const totalIncome = dashboardData?.financial_overview.total_income || 0;
  const totalExpenses = dashboardData?.financial_overview.total_expenses || 0;
  const netBalance = totalIncome - totalExpenses;

  // Recent transactions and outstanding contacts
  const recentTransactions = dashboardData?.recent_transactions || [];
  const outstandingContacts = dashboardData?.outstanding_contacts || [];

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: <Package />,
      accentClassName: 'bg-chart-1/12 text-chart-1',
      loading: isLoading,
      onClick: () => navigate('/products'),
    },
    {
      title: 'Containers',
      value: totalContainers,
      icon: <Warehouse />,
      accentClassName: 'bg-chart-2/20 text-chart-2',
      loading: isLoading,
      onClick: () => navigate('/containers'),
    },
    {
      title: 'Contacts',
      value: totalContacts,
      icon: <Users />,
      accentClassName: 'bg-chart-3/12 text-chart-3',
      loading: isLoading,
      onClick: () => navigate('/contacts'),
    },
    {
      title: 'Total Inventory',
      value: totalInventory.toLocaleString(),
      icon: <Receipt />,
      accentClassName: 'bg-chart-4/12 text-chart-4',
      loading: isLoading,
      onClick: () => navigate('/inventory'),
    },
  ];

  const transactionIcon = (type: string) =>
    type === 'sale' ? <ShoppingCart /> : <Truck />;

  const transactionIconClass = (type: string) =>
    type === 'sale'
      ? 'bg-success/10 text-success'
      : 'bg-primary/10 text-primary';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard {...stat} key={index} />
        ))}
      </div>

      {/* Financial Overview */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 sm:mt-6">
        <FinanceCard
          title="Total Income"
          value={totalIncome}
          icon={<TrendingUp />}
          accentClassName="bg-success/10 text-success"
          valueClassName="text-success"
          loading={isLoading}
          onClick={() => navigate('/payments')}
        />
        <FinanceCard
          title="Total Expenses"
          value={totalExpenses}
          icon={<TrendingDown />}
          accentClassName="bg-destructive/10 text-destructive"
          valueClassName="text-destructive"
          loading={isLoading}
          onClick={() => navigate('/payments')}
        />
        <FinanceCard
          title="Net Balance"
          value={netBalance}
          icon={<Landmark />}
          accentClassName={
            netBalance >= 0
              ? 'bg-chart-3/12 text-chart-3'
              : 'bg-warning/15 text-warning'
          }
          valueClassName={netBalance >= 0 ? 'text-chart-3' : 'text-warning'}
          loading={isLoading}
          onClick={() => navigate('/payments')}
        />
      </div>

      {/* Recent Activity & Outstanding */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12 sm:mt-6">
        {/* Recent Transactions */}
        <div className="md:col-span-7">
          <Card className="h-full gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">
                Recent Transactions
              </CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                >
                  View All
                  <ArrowRight />
                </Button>
              </CardAction>
            </CardHeader>
            <Separator />
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-15 w-full" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <CardContent className="py-10">
                <p className="text-center text-sm text-muted-foreground">
                  No transactions yet
                </p>
              </CardContent>
            ) : (
              <>
                {/* Desktop: table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableBody>
                      {recentTransactions.map((txn) => (
                        <TableRow
                          key={txn.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/transactions/${txn.id}`)}
                        >
                          <TableCell className="w-14 px-4 py-3">
                            <span
                              className={cn(
                                'flex size-9 items-center justify-center rounded-full [&_svg]:size-4',
                                transactionIconClass(txn.type)
                              )}
                            >
                              {transactionIcon(txn.type)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3">
                            <p className="text-sm font-medium">
                              {txn.transaction_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {txn.contact?.name || 'Unknown'}
                            </p>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize',
                                txn.type === 'sale'
                                  ? 'border-success/30 text-success'
                                  : 'border-primary/30 text-primary'
                              )}
                            >
                              {txn.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                'capitalize',
                                paymentStatusClass(txn.payment_status)
                              )}
                            >
                              {txn.payment_status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <p className="text-sm font-semibold tabular-nums">
                              {formatCurrency(txn.total_amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(txn.transaction_date)}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: list */}
                <ul className="flex flex-col p-2 sm:hidden">
                  {recentTransactions.map((txn) => (
                    <li key={txn.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent"
                        onClick={() => navigate(`/transactions/${txn.id}`)}
                      >
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4',
                            transactionIconClass(txn.type)
                          )}
                        >
                          {transactionIcon(txn.type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {txn.transaction_number}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {txn.contact?.name || 'Unknown'}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums">
                            {formatCurrency(txn.total_amount)}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {formatDate(txn.transaction_date)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        {/* Outstanding Balances */}
        <div className="md:col-span-5">
          <Card className="h-full gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">
                Outstanding Balances
              </CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contacts')}
                >
                  View All
                  <ArrowRight />
                </Button>
              </CardAction>
            </CardHeader>
            <Separator />
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : outstandingContacts.length === 0 ? (
              <CardContent className="py-10">
                <p className="text-center text-sm text-muted-foreground">
                  No outstanding balances
                </p>
              </CardContent>
            ) : (
              <ul className="flex flex-col p-2 sm:p-0">
                {outstandingContacts.map((contact, index) => (
                  <li key={contact.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent sm:rounded-none sm:px-6 sm:py-3"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9 [&_svg]:size-4',
                          contact.balance > 0
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        <Users />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium sm:text-base">
                          {contact.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground capitalize sm:text-sm">
                          {contact.type}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-sm font-semibold tabular-nums sm:text-base',
                          contact.balance > 0
                            ? 'text-success'
                            : 'text-destructive'
                        )}
                      >
                        {contact.balance > 0 ? '+' : ''}
                        {formatCurrency(contact.balance)}
                      </span>
                    </button>
                    {index < outstandingContacts.length - 1 && (
                      <Separator />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mt-4 gap-0 sm:mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
            <Button
              className="h-9 bg-success text-success-foreground hover:bg-success/90 sm:h-10 sm:px-6"
              onClick={() => navigate('/transactions/new-sale')}
            >
              <ShoppingCart />
              New Sale
            </Button>
            <Button
              className="h-9 sm:h-10 sm:px-6"
              onClick={() => navigate('/transactions/new-purchase')}
            >
              <Truck />
              New Purchase
            </Button>
            <Button
              variant="outline"
              className="h-9 sm:h-10 sm:px-6"
              onClick={() => navigate('/products')}
            >
              <Package />
              Add Product
            </Button>
            <Button
              variant="outline"
              className="h-9 sm:h-10 sm:px-6"
              onClick={() => navigate('/contacts')}
            >
              <Users />
              Add Contact
            </Button>
            <Button
              variant="outline"
              className="col-span-2 h-9 sm:col-auto sm:h-10 sm:px-6"
              onClick={() => navigate('/payments')}
            >
              <TrendingDown />
              Record Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
