import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { Eye, Package, Shapes, Warehouse } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useInventoryAnalytics, useContainerSearch } from '../../hooks/useContainerProducts';

type StatColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * The MUI theme had `info`/`error` palettes with `.light` shades; the Tailwind
 * theme only exposes flat tokens, so each stat colour is a fixed class triple.
 */
const statColorClasses: Record<StatColor, { surface: string; value: string; iconTile: string }> = {
  primary: {
    surface: 'border-primary/20 from-primary/10 to-primary/5',
    value: 'text-primary',
    iconTile: 'bg-primary/15 text-primary',
  },
  secondary: {
    surface: 'border-secondary-foreground/20 from-secondary-foreground/10 to-secondary-foreground/5',
    value: 'text-secondary-foreground',
    iconTile: 'bg-secondary-foreground/15 text-secondary-foreground',
  },
  success: {
    surface: 'border-success/20 from-success/10 to-success/5',
    value: 'text-success',
    iconTile: 'bg-success/15 text-success',
  },
  warning: {
    surface: 'border-warning/20 from-warning/10 to-warning/5',
    value: 'text-warning',
    iconTile: 'bg-warning/15 text-warning',
  },
  error: {
    surface: 'border-destructive/20 from-destructive/10 to-destructive/5',
    value: 'text-destructive',
    iconTile: 'bg-destructive/15 text-destructive',
  },
  info: {
    surface: 'border-primary/20 from-primary/10 to-primary/5',
    value: 'text-primary',
    iconTile: 'bg-primary/15 text-primary',
  },
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: StatColor;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const classes = statColorClasses[color];

  return (
    <Card className={cn('h-full bg-linear-to-br', classes.surface)}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">{title}</p>
            <p className={cn('text-2xl font-bold', classes.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={cn('rounded-lg p-3', classes.iconTile)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Render search results table
  const renderSearchResults = () => {
    if (searchLoading) {
      return <LoadingState message="Searching..." />;
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <EmptyState
          title="No results found"
          message={`No products matching "${searchQuery}" found in any container`}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Packing</TableHead>
              <TableHead>Container</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <p className="text-sm font-semibold">
                    {item.product?.name || '-'}
                  </p>
                </TableCell>
                <TableCell>{item.product?.size || '-'}</TableCell>
                <TableCell>{item.product?.packing || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-primary text-primary"
                    onClick={() => item.container && navigate(`/containers/${item.container.id}`)}
                  >
                    {item.container?.name || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={item.quantity > 0 ? 'default' : 'outline'}
                    className={
                      item.quantity > 0 ? 'bg-success text-success-foreground' : undefined
                    }
                  >
                    {item.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {item.product && (
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
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (analyticsLoading && !analytics) {
    return <LoadingState message="Loading inventory analytics..." fullPage />;
  }

  if (analyticsError) {
    return <ErrorState onRetry={() => refetchAnalytics()} />;
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Overview of your inventory across all containers"
      />

      {/* Analytics Cards */}
      <div className="mb-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            title="Total Products"
            value={analytics?.totalProducts || 0}
            icon={<Shapes className="size-9" />}
            color="primary"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            title="Total Containers"
            value={analytics?.totalContainers || 0}
            icon={<Warehouse className="size-9" />}
            color="secondary"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <StatCard
            title="Total Stock Quantity"
            value={analytics?.totalQuantity || 0}
            icon={<Package className="size-9" />}
            color="success"
          />
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="mb-2 text-base font-semibold">
          Find Products in Containers
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Search by product name to see which containers hold that product and their quantities.
        </p>
        <div className="flex items-center gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by product name..."
          />
          {searchFetching && !searchLoading && (
            <span className="text-xs text-muted-foreground">Searching...</span>
          )}
        </div>
      </div>

      {/* Search Results or Quick Links */}
      {showSearchResults ? (
        <Card>
          <CardContent>
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold">
              Search Results
              {searchResults && (
                <Badge variant="secondary">{`${searchResults.length} found`}</Badge>
              )}
            </h3>
            {renderSearchResults()}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6">
            <Card
              className="cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate('/products')}
            >
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/15 p-4 text-primary">
                  <Shapes className="size-9" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage your product catalog
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-12 md:col-span-6">
            <Card
              className="cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate('/containers')}
            >
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-secondary p-4 text-secondary-foreground">
                  <Warehouse className="size-9" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Manage Containers</h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage your storage containers
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-12">
            <Card
              className="cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate('/inventory/logs')}
            >
              <CardContent className="flex items-center gap-4">
                <div className="rounded-lg bg-success/15 p-4 text-success">
                  <Package className="size-9" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Inventory Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    View the history of all inventory changes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
