import React from 'react';
import { Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '../../../components/common/EmptyState';
import type { ContainerProductInfo } from '../../../types';

export interface ProductStockDistributionCardProps {
  containers: ContainerProductInfo[];
  onContainerClick: (containerId: number) => void;
  onManageClick?: () => void;
}

export const ProductStockDistributionCard: React.FC<ProductStockDistributionCardProps> = ({
  containers,
  onContainerClick,
  onManageClick,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-5">
        <CardTitle className="text-base font-semibold">Stock distribution</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            {containers.length} container{containers.length !== 1 ? 's' : ''}
          </Badge>
          {onManageClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-primary hover:bg-primary/10 hover:text-primary"
                  aria-label="Manage Containers"
                  onClick={onManageClick}
                >
                  <Boxes />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage Containers</TooltipContent>
            </Tooltip>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {containers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Container</TableHead>
                <TableHead>Type</TableHead>
                <TableHead numeric className="pr-6">
                  Quantity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((cp) => (
                <TableRow
                  key={cp.container.id}
                  className="cursor-pointer"
                  onClick={() => onContainerClick(cp.container.id)}
                >
                  <TableCell className="pl-6">
                    <p className="text-sm font-medium">{cp.container.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {cp.container.type}
                    </Badge>
                  </TableCell>
                  <TableCell numeric className="pr-6 font-medium">
                    {cp.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            compact
            icon={<Boxes />}
            title="Not stored anywhere yet"
            message="This product is not stored in any containers. Assign it to a container to start tracking stock."
            actionLabel={onManageClick ? 'Manage containers' : undefined}
            actionIcon={<Boxes />}
            onAction={onManageClick}
          />
        )}
      </CardContent>
    </Card>
  );
};
