import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { ChevronRight, Eye, Package, SearchX, Shapes, Warehouse } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { useInventoryAnalytics, useContainerSearch } from '../../hooks/useContainerProducts';
import type { ContainerProduct } from '../../types';

type StatColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * The MUI theme had `info`/`error` palettes with `.light` shades; the Tailwind
 * theme only exposes flat tokens, so each stat colour is a single tinted tile.
 * The figure itself stays `foreground` — tinting both reads as an alert.
 */
const statTileClasses: Record<StatColor, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: StatColor;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card className="h-full py-5">
    <CardContent className="flex items-center gap-4">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5',
          statTileClasses[color]
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </span>
        <span className="mt-1 block text-2xl leading-tight font-semibold tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </span>
    </CardContent>
  </Card>
);

interface QuickLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tileClassName: string;
  onClick: () => void;
}

const QuickLink: React.FC<QuickLinkProps> = ({
  title,
  description,
  icon,
  tileClassName,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 rounded-xl border border-border/70 bg-card px-5 py-4 text-left shadow-xs transition-colors hover:border-border hover:bg-accent/40"
  >
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5',
        tileClassName
      )}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-base font-semibold">{title}</span>
      <span className="block text-sm text-muted-foreground">{description}</span>
    </span>
    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
  </button>
);

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useUrlParam('q');

  // Analytics data
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useInventoryAnalytics();

  // Search results
  const {
    data: searchResults,
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useContainerSearch(searchQuery);

  const showSearchResults = searchQuery.trim().length > 0;

  const searchColumns = [
    {
      id: 'product',
      label: 'Product',
      minWidth: 180,
      render: (item: ContainerProduct) => (
        <span className="font-medium">{item.product?.name || '-'}</span>
      ),
    },
    {
      id: 'size',
      label: 'Size',
      render: (item: ContainerProduct) => (
        <span className="text-muted-foreground">{item.product?.size || '-'}</span>
      ),
    },
    {
      id: 'packing',
      label: 'Packing',
      render: (item: ContainerProduct) => (
        <span className="text-muted-foreground">{item.product?.packing || '-'}</span>
      ),
    },
    {
      id: 'container',
      label: 'Container',
      render: (item: ContainerProduct) => (
        <Badge
          variant="outline"
          className="cursor-pointer border-primary/30 bg-primary/10 text-primary"
          onClick={() => item.container && navigate(`/containers/${item.container.id}`)}
        >
          {item.container?.name || '-'}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      label: 'Quantity',
      numeric: true,
      render: (item: ContainerProduct) => (
        <span
          className={cn(
            'font-medium tabular-nums',
            item.quantity > 0 ? 'text-success' : 'text-muted-foreground'
          )}
        >
          {item.quantity}
        </span>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (item: ContainerProduct) =>
        item.product ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="View Product"
                onClick={() => navigate(`/products/${item.product!.id}`)}
              >
                <Eye />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Product</TooltipContent>
          </Tooltip>
        ) : null,
    },
  ];

  // Render search results table
  const renderSearchResults = () => {
    if (searchLoading) {
      return <LoadingState message="Searching..." />;
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <EmptyState
          compact
          icon={<SearchX />}
          title="No results found"
          message={`No products matching "${searchQuery}" are stored in any container.`}
        />
      );
    }

    return (
      <ResponsiveTable
        columns={searchColumns}
        data={searchResults}
        keyExtractor={(item) => item.id}
      />
    );
  };

  if (analyticsLoading && !analytics) {
    return <LoadingState message="Loading inventory analytics..." fullPage />;
  }

  if (analyticsError) {
    return <ErrorState onRetry={() => refetchAnalytics()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle="Overview of your inventory across all containers"
      />

      {/* Analytics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total products"
          value={analytics?.totalProducts || 0}
          icon={<Shapes />}
          color="primary"
        />
        <StatCard
          title="Total containers"
          value={analytics?.totalContainers || 0}
          icon={<Warehouse />}
          color="info"
        />
        <StatCard
          title="Total stock quantity"
          value={analytics?.totalQuantity || 0}
          icon={<Package />}
          color="success"
        />
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Find products in containers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search by product name to see which containers hold that product and
            their quantities.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by product name..."
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {searchFetching && !searchLoading && (
                <span className="text-xs text-muted-foreground">Searching...</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results or Quick Links */}
      {showSearchResults ? (
        <Card className="gap-0 overflow-hidden pb-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              Search results
              {searchResults && (
                <Badge variant="secondary" className="tabular-nums">
                  {`${searchResults.length} found`}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <div className="border-t border-border/70">{renderSearchResults()}</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <QuickLink
            title="Manage products"
            description="View and manage your product catalog"
            icon={<Shapes />}
            tileClassName="bg-primary/10 text-primary"
            onClick={() => navigate('/products')}
          />
          <QuickLink
            title="Manage containers"
            description="View and manage your storage containers"
            icon={<Warehouse />}
            tileClassName="bg-info/10 text-info"
            onClick={() => navigate('/containers')}
          />
          <div className="md:col-span-2">
            <QuickLink
              title="Inventory logs"
              description="View the history of all inventory changes"
              icon={<Package />}
              tileClassName="bg-success/10 text-success"
              onClick={() => navigate('/inventory/logs')}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
