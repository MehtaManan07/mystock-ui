import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Warehouse,
  Users,
  Boxes,
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowRight,
  ShoppingCart,
  Truck,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { cn } from 'cn';
import { useAuthStore } from '../../stores/authStore';
import { useDashboard } from '../../hooks/useDashboard';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });

const paymentStatusClass = (status: string) => {
  if (status === 'paid') return 'border-success/30 bg-success/10 text-success';
  if (status === 'partial') return 'border-warning/40 bg-warning/10 text-warning';
  return 'border-destructive/30 bg-destructive/10 text-destructive';
};

/** Compact, de-emphasised catalogue counter. */
const StatTile: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
  onClick: () => void;
}> = ({ label, value, icon, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:border-border hover:bg-accent/40"
  >
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-[18px]">
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-xs text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="mt-1 h-5 w-14" />
      ) : (
        <span className="block text-lg leading-tight font-semibold tabular-nums">
          {value}
        </span>
      )}
    </span>
  </button>
);

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: dashboardData, isLoading } = useDashboard();

  const totalProducts = dashboardData?.stats.total_products || 0;
  const totalContainers = dashboardData?.stats.total_containers || 0;
  const totalContacts = dashboardData?.stats.total_contacts || 0;
  const totalInventory = dashboardData?.stats.total_inventory || 0;

  const totalIncome = dashboardData?.financial_overview.total_income || 0;
  const totalExpenses = dashboardData?.financial_overview.total_expenses || 0;
  const netBalance = totalIncome - totalExpenses;

  const recentTransactions = dashboardData?.recent_transactions || [];
  const outstandingContacts = dashboardData?.outstanding_contacts || [];

  // Share of the income/expense bar. Guard the zero case so an empty account
  // renders an empty bar rather than NaN%.
  const flowTotal = totalIncome + totalExpenses;
  const incomeShare = flowTotal > 0 ? (totalIncome / flowTotal) * 100 : 0;

  const toCollect = outstandingContacts
    .filter((c) => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);
  const toPay = outstandingContacts
    .filter((c) => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const transactionIcon = (type: string) =>
    type === 'sale' ? <ShoppingCart /> : <Truck />;

  const transactionIconClass = (type: string) =>
    type === 'sale' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary';

  return (
    <div className="space-y-5">
      {/* Greeting + the two things most likely to be done next. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Button onClick={() => navigate('/transactions/new-sale')}>
            <Plus />
            New sale
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/transactions/new-purchase')}
          >
            <Truck />
            New purchase
          </Button>
        </div>
      </div>

      {/* Money first: the numbers that actually drive decisions. */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              label: 'Income',
              value: totalIncome,
              icon: <TrendingUp />,
              tone: 'text-success',
              bg: 'bg-success/10 text-success',
            },
            {
              label: 'Expenses',
              value: totalExpenses,
              icon: <TrendingDown />,
              tone: 'text-destructive',
              bg: 'bg-destructive/10 text-destructive',
            },
            {
              label: 'Net balance',
              value: netBalance,
              icon: <Landmark />,
              tone: netBalance >= 0 ? 'text-foreground' : 'text-warning',
              bg:
                netBalance >= 0
                  ? 'bg-primary/10 text-primary'
                  : 'bg-warning/15 text-warning',
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate('/payments')}
              className="flex flex-col gap-2 p-5 text-left transition-colors hover:bg-accent/35"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg [&_svg]:size-4',
                    item.bg
                  )}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </span>
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <span
                  className={cn(
                    'text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]',
                    item.tone
                  )}
                >
                  {formatCurrency(item.value)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Proportion bar — turns two numbers into one glanceable ratio. */}
        {!isLoading && flowTotal > 0 && (
          <div className="border-t border-border/70 px-5 py-3.5">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-success transition-[width] duration-500"
                style={{ width: `${incomeShare}%` }}
              />
              <div
                className="bg-destructive transition-[width] duration-500"
                style={{ width: `${100 - incomeShare}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Income is{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {incomeShare.toFixed(0)}%
              </span>{' '}
              of total money movement
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Recent transactions */}
        <div className="lg:col-span-7">
          <Card className="h-full gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Recent transactions</CardTitle>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                >
                  View all
                  <ArrowRight />
                </Button>
              </CardAction>
            </CardHeader>
            <Separator />
            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <EmptyState
                compact
                icon={<Receipt />}
                title="No transactions yet"
                message="Sales and purchases will show up here."
                actionLabel="Record a sale"
                actionIcon={<Plus />}
                onAction={() => navigate('/transactions/new-sale')}
              />
            ) : (
              <ul className="flex flex-col">
                {recentTransactions.map((txn) => (
                  <li
                    key={txn.id}
                    className="border-b border-border/70 last:border-0"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 sm:px-5"
                      onClick={() => navigate(`/transactions/${txn.id}`)}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4',
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
                          {txn.contact?.name || 'Unknown'} &middot;{' '}
                          {formatDate(txn.transaction_date)}
                        </span>
                      </span>

                      <Badge
                        variant="outline"
                        className={cn(
                          'hidden shrink-0 capitalize sm:inline-flex',
                          paymentStatusClass(txn.payment_status)
                        )}
                      >
                        {txn.payment_status.replace(/_/g, ' ')}
                      </Badge>

                      <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(txn.total_amount)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Outstanding balances */}
        <div className="lg:col-span-5">
          <Card className="h-full gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Outstanding balances</CardTitle>
              {/* The API returns only the five largest, so say so rather than
                  implying these are company-wide totals. */}
              <p className="text-xs text-muted-foreground">
                Top 5 accounts by balance
              </p>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contacts')}
                >
                  View all
                  <ArrowRight />
                </Button>
              </CardAction>
            </CardHeader>

            {!isLoading && outstandingContacts.length > 0 && (
              <div className="grid grid-cols-2 gap-px border-y border-border/70 bg-border/70">
                <div className="bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">To collect</p>
                  <p className="mt-0.5 text-base font-semibold text-success tabular-nums">
                    {formatCurrency(toCollect)}
                  </p>
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">To pay</p>
                  <p className="mt-0.5 text-base font-semibold text-destructive tabular-nums">
                    {formatCurrency(toPay)}
                  </p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : outstandingContacts.length === 0 ? (
              <EmptyState
                compact
                icon={<Wallet />}
                title="All settled"
                message="No contact has an outstanding balance."
              />
            ) : (
              <ul className="flex flex-col">
                {outstandingContacts.map((contact) => {
                  const isReceivable = contact.balance > 0;
                  return (
                    <li
                      key={contact.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40 sm:px-5"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase',
                            isReceivable
                              ? 'bg-success/10 text-success'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {contact.name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {contact.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {isReceivable ? 'Owes you' : 'You owe'}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'shrink-0 text-sm font-semibold tabular-nums',
                            isReceivable ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {formatCurrency(Math.abs(contact.balance))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Catalogue counts, deliberately demoted to a quiet strip. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Products"
          value={totalProducts}
          icon={<Package />}
          loading={isLoading}
          onClick={() => navigate('/products')}
        />
        <StatTile
          label="Containers"
          value={totalContainers}
          icon={<Warehouse />}
          loading={isLoading}
          onClick={() => navigate('/containers')}
        />
        <StatTile
          label="Contacts"
          value={totalContacts}
          icon={<Users />}
          loading={isLoading}
          onClick={() => navigate('/contacts')}
        />
        <StatTile
          label="Units in stock"
          value={totalInventory.toLocaleString('en-IN')}
          icon={<Boxes />}
          loading={isLoading}
          onClick={() => navigate('/inventory')}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
