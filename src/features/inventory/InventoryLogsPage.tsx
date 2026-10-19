import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { Eye, History, SearchX } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ResponsiveTable } from '../../components/common/ResponsiveTable';
import { useInventoryLogs } from '../../hooks/useInventoryLogs';
import type { InventoryLog } from '../../types';

type ActionFilter = 'all' | 'add' | 'remove' | 'transfer' | 'sale' | 'purchase' | 'adjustment';

/** Outline-badge classes per action; `default` keeps a neutral outline badge. */
const actionBadgeClasses: Record<string, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  default: 'border-border bg-muted text-muted-foreground',
};

export const InventoryLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useUrlParam('q');
  const [actionFilter, setActionFilter] = useUrlParam('action', 'all');

  const {
    data: logs,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useInventoryLogs();

  const showFullLoading = isLoading && !logs;

  // Filter logs based on search and action filter
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter((log) => {
      // Action filter
      if (actionFilter !== 'all' && log.action !== (actionFilter as ActionFilter)) {
        return false;
      }

      // Search filter (by note)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNote = log.note?.toLowerCase().includes(query);
        const matchesAction = log.action.toLowerCase().includes(query);
        if (!matchesNote && !matchesAction) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add':
      case 'purchase':
        return 'success';
      case 'remove':
      case 'sale':
        return 'error';
      case 'transfer':
        return 'info';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isOutward = (action: string) => action === 'remove' || action === 'sale';

  const hasFilters = Boolean(searchQuery) || actionFilter !== 'all';

  const columns = [
    {
      id: 'date',
      label: 'Date',
      minWidth: 160,
      render: (log: InventoryLog) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(log.timestamp || log.created_at)}
        </span>
      ),
    },
    {
      id: 'action',
      label: 'Action',
      render: (log: InventoryLog) => (
        <Badge
          variant="outline"
          className={cn('capitalize', actionBadgeClasses[getActionColor(log.action)])}
        >
          {log.action}
        </Badge>
      ),
    },
    {
      id: 'product',
      label: 'Product',
      render: (log: InventoryLog) => (
        <Badge
          variant="outline"
          className="cursor-pointer tabular-nums"
          onClick={() => navigate(`/products/${log.product_id}`)}
        >
          {`Product #${log.product_id}`}
        </Badge>
      ),
    },
    {
      id: 'container',
      label: 'Container',
      render: (log: InventoryLog) => (
        <Badge
          variant="outline"
          className="cursor-pointer tabular-nums"
          onClick={() => navigate(`/containers/${log.container_id}`)}
        >
          {`Container #${log.container_id}`}
        </Badge>
      ),
    },
    {
      id: 'quantity',
      label: 'Quantity',
      numeric: true,
      render: (log: InventoryLog) => (
        <span
          className={cn(
            'font-semibold tabular-nums',
            isOutward(log.action) ? 'text-destructive' : 'text-success'
          )}
        >
          {isOutward(log.action) ? `-${log.quantity}` : `+${log.quantity}`}
        </span>
      ),
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 180,
      render: (log: InventoryLog) => (
        <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
          {log.note || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center' as const,
      isAction: true,
      render: (log: InventoryLog) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="View Product"
              onClick={() => navigate(`/products/${log.product_id}`)}
            >
              <Eye />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Product</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  const renderTableContent = () => {
    if (showFullLoading) {
      return <LoadingState message="Loading inventory logs..." />;
    }

    if (isError) {
      return <ErrorState onRetry={() => refetch()} />;
    }

    if (!filteredLogs || filteredLogs.length === 0) {
      return (
        <EmptyState
          icon={hasFilters ? <SearchX /> : <History />}
          title={hasFilters ? 'No matching logs' : 'No inventory activity yet'}
          message={
            hasFilters
              ? 'No log entries match the current search and filters.'
              : 'Stock movements across your containers will be recorded here.'
          }
          actionLabel={hasFilters ? undefined : 'Go to inventory'}
          onAction={hasFilters ? undefined : () => navigate('/inventory')}
          secondaryAction={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('all');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <ResponsiveTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(log) => log.id}
      />
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Logs"
        subtitle={logs ? `${filteredLogs.length} log entries` : 'History of inventory changes'}
        breadcrumbs={[
          { label: 'Inventory', path: '/inventory' },
          { label: 'Logs' },
        ]}
      />

      {/* Filters - always visible */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by note or action..."
          className="sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={actionFilter}
            onValueChange={(value) => value && setActionFilter(value)}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="add">Add</ToggleGroupItem>
            <ToggleGroupItem value="remove">Remove</ToggleGroupItem>
            <ToggleGroupItem value="sale">Sale</ToggleGroupItem>
            <ToggleGroupItem value="purchase">Purchase</ToggleGroupItem>
            <ToggleGroupItem value="adjustment">Adjustment</ToggleGroupItem>
          </ToggleGroup>

          {isFetching && !showFullLoading && (
            <span className="text-xs text-muted-foreground">Refreshing...</span>
          )}
        </div>
      </div>

      {/* Logs table */}
      <Card className="gap-0 overflow-hidden py-0">{renderTableContent()}</Card>
    </div>
  );
};

export default InventoryLogsPage;
