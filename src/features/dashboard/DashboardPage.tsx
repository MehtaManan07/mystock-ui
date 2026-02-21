import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  Button,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Inventory2 as ProductIcon,
  Warehouse as ContainerIcon,
  People as ContactIcon,
  Receipt as TransactionIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as BalanceIcon,
  ArrowForward as ArrowIcon,
  ShoppingCart as SaleIcon,
  LocalShipping as PurchaseIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useDashboard } from '../../hooks/useDashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, loading, onClick }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 4, sm: 3 } }}>
        <Box
          sx={{
            position: 'absolute',
            top: { xs: -16, sm: -20 },
            left: { xs: 16, sm: 24 },
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${color} 0%, ${
              theme.palette.mode === 'dark' ? color + 'cc' : color + '99'
            } 100%)`,
            boxShadow: `0 4px 20px ${color}40`,
          }}
        >
          <Box sx={{ color: 'white', fontSize: { xs: 24, sm: 28 }, display: 'flex' }}>{icon}</Box>
        </Box>
        <Box sx={{ textAlign: 'right', mt: { xs: 1, sm: 2 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={40} sx={{ ml: 'auto' }} />
          ) : (
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Fetch all dashboard data in a single API call
  const { data: dashboardData, isLoading } = useDashboard();

  // Extract data with fallbacks
  const totalProducts = dashboardData?.stats.total_products || 0;
  const totalContainers = dashboardData?.stats.total_containers || 0;
  const totalContacts = dashboardData?.stats.total_contacts || 0;
  const totalInventory = dashboardData?.stats.total_inventory || 0;

  // Financial stats
  const totalIncome = dashboardData?.financial_overview.total_income || 0;
  const totalExpenses = dashboardData?.financial_overview.total_expenses || 0;
  const netBalance = totalIncome - totalExpenses;

  // Recent transactions and outstanding contacts
  const recentTransactions = dashboardData?.recent_transactions || [];
  const outstandingContacts = dashboardData?.outstanding_contacts || [];

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: <ProductIcon />,
      color: theme.palette.primary.main,
      loading: isLoading,
      onClick: () => navigate('/products'),
    },
    {
      title: 'Containers',
      value: totalContainers,
      icon: <ContainerIcon />,
      color: theme.palette.secondary.main,
      loading: isLoading,
      onClick: () => navigate('/containers'),
    },
    {
      title: 'Contacts',
      value: totalContacts,
      icon: <ContactIcon />,
      color: theme.palette.info.main,
      loading: isLoading,
      onClick: () => navigate('/contacts'),
    },
    {
      title: 'Total Inventory',
      value: totalInventory.toLocaleString(),
      icon: <TransactionIcon />,
      color: theme.palette.success.main,
      loading: isLoading,
      onClick: () => navigate('/inventory'),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your inventory today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Financial Overview */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 3, sm: 4 } }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[12],
              },
            }}
            onClick={() => navigate('/payments')}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <IncomeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Total Income</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width={120} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              ) : (
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {formatCurrency(totalIncome)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[12],
              },
            }}
            onClick={() => navigate('/payments')}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ExpenseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Total Expenses</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width={120} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              ) : (
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {formatCurrency(totalExpenses)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              background:
                netBalance >= 0
                  ? `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[12],
              },
            }}
            onClick={() => navigate('/payments')}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BalanceIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Net Balance</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width={120} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              ) : (
                <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                  {formatCurrency(netBalance)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity & Outstanding */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 2 }}>
        {/* Recent Transactions */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardHeader
              title="Recent Transactions"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: { xs: '1rem', sm: '1.25rem' } } }}
              action={
                <Button
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/transactions')}
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View All
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}
            />
            <Divider />
            {isLoading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : recentTransactions.length === 0 ? (
              <CardContent>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No transactions yet
                </Typography>
              </CardContent>
            ) : (
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Table>
                  <TableBody>
                    {recentTransactions.map((txn) => (
                      <TableRow
                        key={txn.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/transactions/${txn.id}`)}
                      >
                        <TableCell sx={{ width: 50 }}>
                          <Avatar
                            sx={{
                              bgcolor:
                                txn.type === 'sale'
                                  ? theme.palette.success.light
                                  : theme.palette.primary.light,
                              width: 36,
                              height: 36,
                            }}
                          >
                            {txn.type === 'sale' ? (
                              <SaleIcon fontSize="small" />
                            ) : (
                              <PurchaseIcon fontSize="small" />
                            )}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {txn.transaction_number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {txn.contact?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={txn.type}
                            size="small"
                            color={txn.type === 'sale' ? 'success' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={txn.payment_status.replace(/_/g, ' ')}
                            size="small"
                            color={
                              txn.payment_status === 'paid'
                                ? 'success'
                                : txn.payment_status === 'partial'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(txn.total_amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(txn.transaction_date)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
            {/* Mobile view for transactions */}
            {!isLoading && recentTransactions.length > 0 && (
              <List sx={{ display: { xs: 'block', sm: 'none' }, p: 1 }}>
                {recentTransactions.map((txn) => (
                  <ListItem
                    key={txn.id}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/transactions/${txn.id}`)}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor:
                            txn.type === 'sale'
                              ? theme.palette.success.light
                              : theme.palette.primary.light,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {txn.type === 'sale' ? (
                          <SaleIcon fontSize="small" />
                        ) : (
                          <PurchaseIcon fontSize="small" />
                        )}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={txn.transaction_number}
                      secondary={txn.contact?.name || 'Unknown'}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600} fontSize="0.875rem">
                        {formatCurrency(txn.total_amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(txn.transaction_date)}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Grid>

        {/* Outstanding Balances */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader
              title="Outstanding Balances"
              titleTypographyProps={{ variant: 'h6', sx: { fontSize: { xs: '1rem', sm: '1.25rem' } } }}
              action={
                <Button
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/contacts')}
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View All
                </Button>
              }
              sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}
            />
            <Divider />
            {isLoading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={50} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : outstandingContacts.length === 0 ? (
              <CardContent>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No outstanding balances
                </Typography>
              </CardContent>
            ) : (
              <List disablePadding sx={{ p: { xs: 1, sm: 0 } }}>
                {outstandingContacts.map((contact, index) => (
                  <React.Fragment key={contact.id}>
                    <ListItem
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, px: { xs: 1, sm: 2 } }}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor:
                              contact.balance > 0
                                ? theme.palette.success.light
                                : theme.palette.error.light,
                            width: { xs: 32, sm: 36 },
                            height: { xs: 32, sm: 36 },
                          }}
                        >
                          <ContactIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={contact.name}
                        secondary={contact.type}
                        primaryTypographyProps={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={contact.balance > 0 ? 'success.main' : 'error.main'}
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {contact.balance > 0 ? '+' : ''}
                        {formatCurrency(contact.balance)}
                      </Typography>
                    </ListItem>
                    {index < outstandingContacts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: { xs: 2, sm: 3 } }}>
        <CardHeader 
          title="Quick Actions" 
          titleTypographyProps={{ variant: 'h6', sx: { fontSize: { xs: '1rem', sm: '1.25rem' } } }}
          sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaleIcon />}
              onClick={() => navigate('/transactions/new-sale')}
              sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 1 auto' } }}
              size={isMobile ? 'medium' : 'large'}
            >
              New Sale
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PurchaseIcon />}
              onClick={() => navigate('/transactions/new-purchase')}
              sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 1 auto' } }}
              size={isMobile ? 'medium' : 'large'}
            >
              New Purchase
            </Button>
            <Button
              variant="outlined"
              startIcon={<ProductIcon />}
              onClick={() => navigate('/products')}
              sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 1 auto' } }}
              size={isMobile ? 'medium' : 'large'}
            >
              Add Product
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContactIcon />}
              onClick={() => navigate('/contacts')}
              sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 1 auto' } }}
              size={isMobile ? 'medium' : 'large'}
            >
              Add Contact
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExpenseIcon />}
              onClick={() => navigate('/payments')}
              sx={{ flex: { xs: '1 1 100%', sm: '0 1 auto' } }}
              size={isMobile ? 'medium' : 'large'}
            >
              Record Payment
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
