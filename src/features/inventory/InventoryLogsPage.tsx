import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUrlParam } from '../../hooks/useUrlFilters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchInput } from '../../components/common/SearchInput';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useInventoryLogs } from '../../hooks/useInventoryLogs';
import type { InventoryLog } from '../../types';

type ActionFilter = 'all' | 'add' | 'remove' | 'transfer' | 'sale' | 'purchase' | 'adjustment';

/** Outline-badge classes per action; `default` keeps the plain outline badge. */
const actionBadgeClasses: Record<string, string> = {
  success: 'border-success text-success',
  error: 'border-destructive text-destructive',
  info: 'border-primary text-primary',
  warning: 'border-warning text-warning',
  default: '',
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
          title="No logs found"
          message={
            searchQuery || actionFilter !== 'all'
              ? 'Try different filters'
              : 'No inventory activity has been recorded yet'
          }
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Product ID</TableHead>
              <TableHead>Container ID</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log: InventoryLog) => (
              <TableRow key={log.id}>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(log.timestamp || log.created_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={actionBadgeClasses[getActionColor(log.action)]}
                  >
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => navigate(`/products/${log.product_id}`)}
                  >
                    {`Product #${log.product_id}`}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => navigate(`/containers/${log.container_id}`)}
                  >
                    {`Container #${log.container_id}`}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      log.action === 'remove' || log.action === 'sale'
                        ? 'bg-destructive text-white'
                        : 'bg-success text-success-foreground'
                    }
                  >
                    {log.action === 'remove' || log.action === 'sale' ? `-${log.quantity}` : `+${log.quantity}`}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {log.note || '-'}
                  </p>
                </TableCell>
                <TableCell className="text-center">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Inventory Logs"
        subtitle={logs ? `${filteredLogs.length} log entries` : 'History of inventory changes'}
        breadcrumbs={[
          { label: 'Inventory', path: '/inventory' },
          { label: 'Logs' },
        ]}
      />

      {/* Filters - always visible */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by note or action..."
        />

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

      {/* Logs table */}
      <Card className="gap-0 overflow-hidden py-0">{renderTableContent()}</Card>
    </div>
  );
};

export default InventoryLogsPage;
