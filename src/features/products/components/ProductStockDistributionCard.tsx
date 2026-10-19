import React from 'react';
import { Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
}) => (
  <Card>
    <CardContent>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Stock Distribution ({containers.length} containers)
        </h3>
        {onManageClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-primary"
                aria-label="Manage Containers"
                onClick={onManageClick}
              >
                <Boxes />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Containers</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Separator className="mb-4" />

      {containers.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Container</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.map((cp) => (
                <TableRow
                  key={cp.container.id}
                  className="cursor-pointer"
                  onClick={() => onContainerClick(cp.container.id)}
                >
                  <TableCell>
                    <p className="text-sm font-medium">{cp.container.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{cp.container.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{cp.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This product is not stored in any containers yet.
        </p>
      )}
    </CardContent>
  </Card>
);
