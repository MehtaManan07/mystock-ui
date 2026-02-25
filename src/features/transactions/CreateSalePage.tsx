import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  Drafts as DraftsIcon,
} from '@mui/icons-material';
import { PageHeader } from '../../components/common/PageHeader';
import { useContacts } from '../../hooks/useContacts';
import { useProducts } from '../../hooks/useProducts';
import { useProductContainers } from '../../hooks/useContainerProducts';
import { useCreateSale } from '../../hooks/useTransactions';
import { useDebounce } from '../../hooks/useDebounce';
import { useDrafts, useDeleteDraft } from '../../hooks/useDrafts';
import { useDraftAutoSaveServer } from '../../hooks/useDraftAutoSaveServer';
import { CONTACT_TYPES, PAYMENT_METHODS, PRODUCT_DETAILS_DISPLAY_MODE, type PaymentMethod, type ProductDetailsDisplayMode } from '../../constants';
import type { Contact, Product, CreateTransactionDto, CreateTransactionItemDto } from '../../types';
import type { Draft } from '../../api/drafts.api';
import { draftsApi } from '../../api/drafts.api';
import { DraftListDialog } from '../../components/drafts/DraftListDialog';

interface ContainerOption {
  id: number;
  name: string;
  type: string;
  quantity: number; // Available quantity in items
}

interface LineItem {
  id: string;
  product: Product | null;
  container: ContainerOption | null;
  availableQty: number; // Available items
  quantity: number; // Quantity in items
  unit_price: number;
}

export const CreateSalePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CASH);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [productDetailsDisplayMode, setProductDetailsDisplayMode] = useState<ProductDetailsDisplayMode>(PRODUCT_DETAILS_DISPLAY_MODE.CUSTOMER_SKU);

  // Draft state
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // For adding new items
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<ContainerOption | null>(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState(0);

  // Product search with debouncing
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Data fetching
  const { data: contacts, isLoading: contactsLoading } = useContacts({ 
    types: [CONTACT_TYPES.CUSTOMER, CONTACT_TYPES.BOTH] 
  });
  const { data: products, isLoading: productsLoading } = useProducts(debouncedProductSearch);
  
  // Get containers that have the selected product (with their quantities)
  const { data: productContainers, isLoading: containersLoading } = useProductContainers(
    selectedProduct?.id || 0
  );
  
  const createSaleMutation = useCreateSale();

  // Draft management - server-based
  const { data: drafts = [] } = useDrafts('sale');
  const deleteDraftMutation = useDeleteDraft();

  // Auto-save hook - server-based
  const { currentDraftId, deleteDraftOnUnmount } = useDraftAutoSaveServer(
    'sale',
    {
      transactionDate,
      contactId: selectedContact?.id || null,
      items: items.map(item => ({
        productId: item.product!.id,
        containerId: item.container!.id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      taxPercent,
      discountAmount,
      paidAmount,
      paymentMethod: paidAmount > 0 ? paymentMethod : undefined,
      paymentReference: paidAmount > 0 ? paymentReference : undefined,
      notes: notes || undefined,
      productDetailsDisplayMode,
    },
    isDraftMode
  );

  // Load prefilled items from Deodap bill flow
  useEffect(() => {
    const state = location.state as { prefillItems?: Array<{
      product: Product;
      container: ContainerOption;
      quantity: number;
      unit_price: number;
    }> } | null;

    if (state?.prefillItems && state.prefillItems.length > 0 && items.length === 0) {
      // Clear any existing draft to avoid conflicts with stale draft IDs
      deleteDraftOnUnmount();
      
      // Disable draft mode when prefilling from Deodap
      setIsDraftMode(false);
      
      const prefillItems: LineItem[] = state.prefillItems.map((item, index) => ({
        id: `prefill-${Date.now()}-${index}`,
        product: item.product,
        container: item.container,
        availableQty: item.container.quantity,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));
      setItems(prefillItems);
      
      // Clear the location state to prevent re-applying on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, items.length, location.pathname, navigate, deleteDraftOnUnmount]);

  // Convert ContainerProduct[] to ContainerOption[] for the dropdown
  const containerOptions: ContainerOption[] = useMemo(() => {
    if (!productContainers) return [];
    return productContainers
      .filter(cp => cp.container && cp.quantity > 0) // Only show containers with stock
      .map(cp => ({
        id: cp.container!.id,
        name: cp.container!.name,
        type: cp.container!.type,
        quantity: cp.quantity, // Already in items
      }));
  }, [productContainers]);

  // Available quantity in items
  const availableQtyItems = useMemo(() => {
    if (!selectedContainer) return 0;
    return selectedContainer.quantity;
  }, [selectedContainer]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [items]);

  // Calculate tax amount from percentage
  const taxAmount = useMemo(() => {
    return subtotal * (taxPercent / 100);
  }, [subtotal, taxPercent]);

  const totalAmount = subtotal + taxAmount - discountAmount;

  // Before navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentDraftId || items.length > 0 || selectedContact) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentDraftId, items.length, selectedContact]);

  // Load draft into form
  const handleLoadDraft = async (draft: Draft) => {
    const data = draft.data;
    setTransactionDate(data.transactionDate);
    setTaxPercent(data.taxPercent);
    setDiscountAmount(data.discountAmount);
    setPaidAmount(data.paidAmount);
    if (data.paymentMethod) setPaymentMethod(data.paymentMethod as PaymentMethod);
    if (data.paymentReference) setPaymentReference(data.paymentReference);
    if (data.notes) setNotes(data.notes);
    if (data.productDetailsDisplayMode) {
      setProductDetailsDisplayMode(data.productDetailsDisplayMode as ProductDetailsDisplayMode);
    }

    // Load contact
    if (data.contactId && contacts) {
      const contact = contacts.find(c => c.id === data.contactId);
      if (contact) setSelectedContact(contact);
    }

    // Load items - use optimized endpoint with hydrated data
    if (data.items.length > 0) {
      try {
        // Single API call to get draft with hydrated products and containers
        const completeDraft = await draftsApi.getComplete(draft.id);
        
        // Map hydrated items directly to LineItem format
        const loadedItems: LineItem[] = completeDraft.items.map(item => ({
          id: `${Date.now()}-${item.productId}-${item.containerId}-${Math.random()}`,
          product: item.product,
          container: {
            id: item.container.id,
            name: item.container.name,
            type: item.container.type,
            quantity: 0, // Not needed for sales, will be refreshed from actual inventory
          },
          availableQty: 0, // Will be refreshed when product is selected
          quantity: item.quantity,
          unit_price: typeof item.unitPrice === 'string' 
            ? parseFloat(item.unitPrice) 
            : item.unitPrice,
        }));

        setItems(loadedItems);
      } catch (error) {
        console.error('Failed to load draft items:', error);
      }
    }

    setShowDraftDialog(false);
    setIsDraftMode(true);
  };

  // Set default price when product changes and reset container
  const handleProductChange = (product: Product | null) => {
    setSelectedProduct(product);
    setSelectedContainer(null); // Reset container when product changes
    if (product?.default_sale_price) {
      setNewUnitPrice(product.default_sale_price);
    } else {
      setNewUnitPrice(0);
    }
  };

  // Add item to list
  const handleAddItem = () => {
    if (!selectedProduct || !selectedContainer) {
      setError('Please select a product and container');
      return;
    }
    if (newQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (newQuantity > availableQtyItems) {
      setError(`Only ${availableQtyItems} items available in this container`);
      return;
    }
    if (newUnitPrice < 0) {
      setError('Price cannot be negative');
      return;
    }

    // Check if same product-container combo already exists
    const existingIndex = items.findIndex(
      i => i.product?.id === selectedProduct.id && i.container?.id === selectedContainer.id
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      const existingItem = updatedItems[existingIndex];
      const newTotalQty = existingItem.quantity + newQuantity;
      
      if (newTotalQty > availableQtyItems) {
        setError(`Only ${availableQtyItems} items available. Already added ${existingItem.quantity}.`);
        return;
      }
      
      updatedItems[existingIndex] = {
        ...existingItem,
        quantity: newTotalQty,
      };
      setItems(updatedItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          id: `${Date.now()}`,
          product: selectedProduct,
          container: selectedContainer,
          availableQty: availableQtyItems,
          quantity: newQuantity,
          unit_price: newUnitPrice,
        },
      ]);
    }

    // Reset form
    setSelectedProduct(null);
    setSelectedContainer(null);
    setNewQuantity(1);
    setNewUnitPrice(0);
    setError(null);
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedContact) {
      setError('Please select a customer');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const transactionItems: CreateTransactionItemDto[] = items.map(item => ({
      product_id: item.product!.id,
      container_id: item.container!.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const data: CreateTransactionDto = {
      transaction_date: transactionDate,
      contact_id: selectedContact.id,
      items: transactionItems,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      paid_amount: paidAmount,
      payment_method: paidAmount > 0 ? paymentMethod : undefined,
      payment_reference: paidAmount > 0 ? paymentReference || undefined : undefined,
      notes: notes || undefined,
      product_details_display_mode: productDetailsDisplayMode,
    };

    try {
      const result = await createSaleMutation.mutateAsync(data);

      // Delete draft after successful submission
      if (currentDraftId) {
        deleteDraftOnUnmount();
      }

      navigate(`/transactions/${result.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sale';
      setError(errorMessage);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Box>
      <PageHeader
        title="New Sale"
        subtitle="Create a new sale transaction"
        breadcrumbs={[
          { label: 'Transactions', path: '/transactions' },
          { label: 'New Sale' },
        ]}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/transactions')}
        >
          Back to Transactions
        </Button>
      </Box>

      {/* Draft Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isDraftMode}
                  onChange={(e) => setIsDraftMode(e.target.checked)}
                />
              }
              label="Auto-save draft"
            />

            <Button
              variant="outlined"
              startIcon={<DraftsIcon />}
              onClick={() => setShowDraftDialog(true)}
            >
              Load Draft ({drafts.length})
            </Button>

            {currentDraftId && isDraftMode && (
              <Chip
                label="Draft saved"
                color="success"
                size="small"
                icon={<CheckIcon />}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Draft Dialog */}
      <DraftListDialog
        open={showDraftDialog}
        drafts={drafts}
        onClose={() => setShowDraftDialog(false)}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={(id) => deleteDraftMutation.mutate(id)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Items */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Add Item Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Items
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2} alignItems="flex-start">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Autocomplete
                    value={selectedProduct}
                    onChange={(_, value) => handleProductChange(value)}
                    onInputChange={(_, value) => setProductSearch(value)}
                    options={products || []}
                    getOptionLabel={(option) => 
                      option.company_sku 
                        ? `${option.company_sku} - ${option.name} (${option.size})`
                        : `${option.name} (${option.size})`
                    }
                    loading={productsLoading}
                    filterOptions={(x) => x}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product"
                        size="small"
                        placeholder="Search products..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productsLoading && <CircularProgress size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Autocomplete
                    value={selectedContainer}
                    onChange={(_, value) => setSelectedContainer(value)}
                    options={containerOptions}
                    getOptionLabel={(option) => `${option.name} (${option.quantity} items avail)`}
                    loading={containersLoading}
                    disabled={!selectedProduct}
                    noOptionsText={selectedProduct ? "No stock in any container" : "Select a product first"}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Container"
                        size="small"
                        helperText={
                          !selectedProduct 
                            ? 'Select product first' 
                            : containerOptions.length === 0 
                            ? 'No stock available' 
                            : ''
                        }
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{option.name}</span>
                          <Chip 
                            label={`${option.quantity} items`}
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Qty (items)"
                    type="number"
                    size="small"
                    fullWidth
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1, max: availableQtyItems }}
                    helperText={selectedContainer && selectedProduct ? `${availableQtyItems} items available` : ''}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Price"
                    type="number"
                    size="small"
                    fullWidth
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || !selectedContainer}
                    sx={{ minWidth: 0, px: 2 }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Items List Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Items ({items.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {items.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Container</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.product?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.product?.size} • {item.product?.packing}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.container?.name} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{item.quantity} items</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            {formatCurrency(item.quantity * item.unit_price)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No items added yet. Use the form above to add products.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sale Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <Autocomplete
                  value={selectedContact}
                  onChange={(_, value) => setSelectedContact(value)}
                  options={contacts || []}
                  getOptionLabel={(option) => `${option.name} (${option.phone})`}
                  loading={contactsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer"
                      size="small"
                      required
                    />
                  )}
                />

                <TextField
                  label="Product Details Display"
                  select
                  size="small"
                  fullWidth
                  value={productDetailsDisplayMode}
                  onChange={(e) => setProductDetailsDisplayMode(e.target.value as ProductDetailsDisplayMode)}
                  helperText="How products appear on invoice"
                >
                  <MenuItem value={PRODUCT_DETAILS_DISPLAY_MODE.CUSTOMER_SKU}>
                    Customer SKU
                  </MenuItem>
                  <MenuItem value={PRODUCT_DETAILS_DISPLAY_MODE.COMPANY_SKU}>
                    Company SKU
                  </MenuItem>
                  <MenuItem value={PRODUCT_DETAILS_DISPLAY_MODE.PRODUCT_NAME}>
                    Product Name
                  </MenuItem>
                </TextField>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                </Box>

                <Box>
                  <TextField
                    label="Tax %"
                    type="number"
                    size="small"
                    fullWidth
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                    InputProps={{
                      endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>%</Typography>,
                    }}
                  />
                  {taxPercent > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Tax: {formatCurrency(taxAmount)}
                    </Typography>
                  )}
                </Box>

                <TextField
                  label="Discount Amount"
                  type="number"
                  size="small"
                  fullWidth
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                />

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>

                <Divider />

                <TextField
                  label="Amount Paid Now"
                  type="number"
                  size="small"
                  fullWidth
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, max: totalAmount, step: 0.01 }}
                />

                {paidAmount > 0 && (
                  <>
                    <TextField
                      label="Payment Method"
                      select
                      size="small"
                      fullWidth
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {Object.values(PAYMENT_METHODS).map((method) => (
                        <MenuItem key={method} value={method}>
                          {method.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Payment Reference"
                      size="small"
                      fullWidth
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Check #, UPI ID, etc."
                    />
                  </>
                )}

                <TextField
                  label="Notes"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Balance Due</Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color={totalAmount - paidAmount > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(totalAmount - paidAmount)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={createSaleMutation.isPending || items.length === 0 || !selectedContact}
                >
                  {createSaleMutation.isPending ? 'Creating...' : 'Create Sale'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateSalePage;
