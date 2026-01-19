import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
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
  actionIcon = <AddIcon />,
  onAction,
  actionDisabled = false,
  action,
}) => {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast || !item.path ? (
              <Typography key={item.label} color="text.primary" variant="body2" sx={{ fontSize: 'inherit' }}>
                {item.label}
              </Typography>
            ) : (
              <Link
                key={item.label}
                component={RouterLink}
                to={item.path}
                underline="hover"
                color="inherit"
                variant="body2"
                sx={{ fontSize: 'inherit' }}
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            gutterBottom={!!subtitle}
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {action ? (
          <Box sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
            {action}
          </Box>
        ) : (
          actionLabel && onAction && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={onAction}
              disabled={actionDisabled}
              fullWidth
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: 'fit-content' },
              }}
            >
              {actionLabel}
            </Button>
          )
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
