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
    <div className="mb-6 sm:mb-7">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-2.5">
          <BreadcrumbList className="text-xs sm:text-xs">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={item.label}>
                  <BreadcrumbItem>
                    {isLast || !item.path ? (
                      <BreadcrumbPage className="font-medium">
                        {item.label}
                      </BreadcrumbPage>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {action
          ? <div className="shrink-0 self-stretch sm:self-auto">{action}</div>
          : actionLabel && onAction && (
              <Button
                onClick={onAction}
                disabled={actionDisabled}
                className="w-full shrink-0 sm:w-auto"
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
