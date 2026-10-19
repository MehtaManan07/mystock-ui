import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemType {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemType[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Custom action element - takes precedence over actionLabel/onAction */
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actionLabel,
  actionIcon = <Plus />,
  onAction,
  actionDisabled = false,
  action,
}) => {
  return (
    <div className="mb-6 sm:mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={item.label}>
                  <BreadcrumbItem>
                    {isLast || !item.path ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <RouterLink to={item.path}>{item.label}</RouterLink>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {action
          ? <div className="self-stretch sm:self-start">{action}</div>
          : actionLabel && onAction && (
              <Button
                onClick={onAction}
                disabled={actionDisabled}
                className="w-full sm:w-auto"
              >
                {actionIcon}
                {actionLabel}
              </Button>
            )}
      </div>
    </div>
  );
};

export default PageHeader;
