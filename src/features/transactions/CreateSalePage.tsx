import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  FileStack,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from './components/Combobox';
import { PageHeader } from '../../components/common/PageHeader';
import { useContacts } from '../../hooks/useContacts';
import { useProducts } from '../../hooks/useProducts';
import { useProductContainers } from '../../hooks/useContainerProducts';
import { useCreateSale } from '../../hooks/useTransactions';
import { useDebounce } from '../../hooks/useDebounce';
import { useDrafts, useDeleteDraft, useCompleteDraft } from '../../hooks/useDrafts';
import type { Draft } from '../../api/drafts.api';
import { useDraftAutoSaveServer } from '../../hooks/useDraftAutoSaveServer';
import { CONTACT_TYPES, PAYMENT_METHODS, PRODUCT_DETAILS_DISPLAY_MODE, type PaymentMethod, type ProductDetailsDisplayMode } from '../../constants';
import type { Contact, Product, CreateTransactionDto, CreateTransactionItemDto, TaxType } from '../../types';
import { useSettings } from '../../hooks/useSettings';
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
  /** Per-line GST %. null means "no rate set" — falls back to the invoice-level GST %. */
  tax_rate: number | null;
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
  const [taxType, setTaxType] = useState<TaxType>('cgst_sgst');
  const [taxTypeAutoSet, setTaxTypeAutoSet] = useState(false);

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
  
  const { data: companySettings } = useSettings();
  const createSaleMutation = useCreateSale();

  // Draft management - server-based
  const { data: drafts = [] } = useDrafts('sale');
  const deleteDraftMutation = useDeleteDraft();
  const getCompleteDraft = useCompleteDraft();

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

  // Auto-determine tax type when contact changes
  useEffect(() => {
    if (!selectedContact || !companySettings) return;
    const sellerState = companySettings.seller_gstin?.substring(0, 2);
    if (selectedContact.gstin && selectedContact.gstin.length >= 2) {
      const buyerState = selectedContact.gstin.substring(0, 2);
      const newTaxType: TaxType = sellerState === buyerState ? 'cgst_sgst' : 'igst';
      setTaxType(newTaxType);
      setTaxTypeAutoSet(true);
    } else {
      // No GSTIN — let user choose, default to intra-state
      setTaxType('cgst_sgst');
      setTaxTypeAutoSet(false);
    }
  }, [selectedContact, companySettings]);

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
        tax_rate: item.product.gst_rate ?? null,
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

  // A line's own GST % wins. If at least one line has one, the invoice is taxed
  // line by line and the invoice-level GST % is ignored — this is what keeps a
  // mixed-slab bill (say 18% and 5%) correct instead of averaging the two.
  const hasPerLineRates = useMemo(
    () => items.some(item => item.tax_rate !== null && item.tax_rate !== undefined),
    [items]
  );

  const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

  // One entry per distinct GST %, so the summary can show a real slab breakup.
  const rateBreakdown = useMemo(() => {
    const buckets = new Map<number, { taxable: number; tax: number }>();
    if (!hasPerLineRates) return buckets;
    for (const item of items) {
      const rate = item.tax_rate ?? 0;
      const taxable = item.quantity * item.unit_price;
      const bucket = buckets.get(rate) ?? { taxable: 0, tax: 0 };
      bucket.taxable += taxable;
      bucket.tax += round2((taxable * rate) / 100);
      buckets.set(rate, bucket);
    }
    return buckets;
  }, [items, hasPerLineRates]);

  // Calculate tax amount: per line when rates exist, else the invoice-level GST %
  const taxAmount = useMemo(() => {
    if (hasPerLineRates) {
      let total = 0;
      for (const bucket of rateBreakdown.values()) total += bucket.tax;
      return round2(total);
    }
    return subtotal * (taxPercent / 100);
  }, [hasPerLineRates, rateBreakdown, subtotal, taxPercent]);

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
        const completeDraft = await getCompleteDraft(draft.id);
        
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
          tax_rate: item.product.gst_rate ?? null,
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
          tax_rate: selectedProduct.gst_rate ?? null,
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

  // Change a single line's GST %. Blank clears it back to the invoice-level rate.
  const handleChangeItemTaxRate = (id: string, raw: string) => {
    const trimmed = raw.trim();
    let nextRate: number | null = null;
    if (trimmed !== '') {
      const parsed = parseFloat(trimmed);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) return;
      nextRate = parsed;
    }
    setItems(items.map(i => (i.id === id ? { ...i, tax_rate: nextRate } : i)));
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
      ...(item.tax_rate !== null && item.tax_rate !== undefined
        ? { tax_rate: item.tax_rate }
        : {}),
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
      tax_type: taxType,
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
    <div>
      <PageHeader
        title="New Sale"
        subtitle="Create a new sale transaction"
        breadcrumbs={[
          { label: 'Transactions', path: '/transactions' },
          { label: 'New Sale' },
        ]}
      />

      <div className="mb-4">
        <Button asChild variant="ghost">
          <a
            href="/transactions"
            onClick={(e: React.MouseEvent) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                navigate('/transactions');
              }
            }}
          >
            <ArrowLeft />
            Back to Transactions
          </a>
        </Button>
      </div>

      {/* Draft Controls */}
      <Card className="mb-4">
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="sale-draft-mode"
                checked={isDraftMode}
                onCheckedChange={(checked) => setIsDraftMode(checked)}
              />
              <Label htmlFor="sale-draft-mode">Auto-save draft</Label>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowDraftDialog(true)}
            >
              <FileStack />
              Load Draft ({drafts.length})
            </Button>

            {currentDraftId && isDraftMode && (
              <Badge className="bg-success text-success-foreground">
                <Check />
                Draft saved
              </Badge>
            )}
          </div>
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
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss error"
            className="absolute top-1.5 right-1.5"
            onClick={() => setError(null)}
          >
            <X />
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Items */}
        <div className="col-span-12 md:col-span-8">
          {/* Add Item Card */}
          <Card className="mb-6">
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Add Items</h3>
              <Separator className="mb-4" />

              <div className="grid grid-cols-12 items-start gap-4">
                <div className="col-span-12 grid gap-2 sm:col-span-4">
                  <Label htmlFor="sale-product">Product</Label>
                  <Combobox
                    id="sale-product"
                    value={selectedProduct}
                    onChange={(value) => handleProductChange(value)}
                    onInputChange={(value) => setProductSearch(value)}
                    options={products || []}
                    getOptionKey={(option) => option.id}
                    getOptionLabel={(option) =>
                      option.company_sku
                        ? `${option.company_sku} - ${option.name} (${option.size})`
                        : `${option.name} (${option.size})`
                    }
                    loading={productsLoading}
                    disableFiltering
                    placeholder="Search products..."
                    searchPlaceholder="Search products..."
                    emptyText="No products"
                  />
                </div>
                <div className="col-span-12 grid gap-2 sm:col-span-3">
                  <Label htmlFor="sale-container">Container</Label>
                  <Combobox
                    id="sale-container"
                    value={selectedContainer}
                    onChange={(value) => setSelectedContainer(value)}
                    options={containerOptions}
                    getOptionKey={(option) => option.id}
                    getOptionLabel={(option) => `${option.name} (${option.quantity} items avail)`}
                    loading={containersLoading}
                    disabled={!selectedProduct}
                    placeholder="Select container"
                    searchPlaceholder="Search containers..."
                    emptyText={selectedProduct ? 'No stock in any container' : 'Select a product first'}
                    renderOption={(option) => (
                      <div className="flex w-full justify-between gap-2">
                        <span className="truncate">{option.name}</span>
                        <Badge variant="outline" className="border-success/50 text-success">
                          {option.quantity} items
                        </Badge>
                      </div>
                    )}
                  />
                  <p className="text-sm text-muted-foreground">
                    {!selectedProduct
                      ? 'Select product first'
                      : containerOptions.length === 0
                      ? 'No stock available'
                      : ''}
                  </p>
                </div>
                <div className="col-span-6 grid gap-2 sm:col-span-2">
                  <Label htmlFor="sale-qty">Qty (items)</Label>
                  <Input
                    id="sale-qty"
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    min={1}
                    max={availableQtyItems}
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedContainer && selectedProduct ? `${availableQtyItems} items available` : ''}
                  </p>
                </div>
                <div className="col-span-6 grid gap-2 sm:col-span-2">
                  <Label htmlFor="sale-price">Price</Label>
                  <Input
                    id="sale-price"
                    type="number"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 sm:self-end">
                  <Button
                    aria-label="Add item"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || !selectedContainer}
                    className="px-4"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List Card */}
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Items ({items.length})</h3>
              <Separator className="mb-4" />

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Container</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">GST %</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{item.product?.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {item.product?.size} • {item.product?.packing}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.container?.name}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity} items</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              aria-label="GST %"
                              placeholder="—"
                              value={item.tax_rate ?? ''}
                              onChange={(e) => handleChangeItemTaxRate(item.id, e.target.value)}
                              min={0}
                              max={100}
                              step={0.5}
                              className="ml-auto w-[84px] text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              item.quantity * item.unit_price +
                                (item.tax_rate
                                  ? round2((item.quantity * item.unit_price * item.tax_rate) / 100)
                                  : 0)
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove item"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No items added yet. Use the form above to add products.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="col-span-12 md:col-span-4">
          <Card>
            <CardContent>
              <h3 className="mb-2 text-base font-semibold">Sale Details</h3>
              <Separator className="mb-4" />

              <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="sale-date">Date</Label>
                  <Input
                    id="sale-date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sale-customer">Customer *</Label>
                  <Combobox
                    id="sale-customer"
                    value={selectedContact}
                    onChange={(value) => setSelectedContact(value)}
                    options={contacts || []}
                    getOptionKey={(option) => option.id}
                    getOptionLabel={(option) => `${option.name} (${option.phone})`}
                    loading={contactsLoading}
                    placeholder="Select customer"
                    searchPlaceholder="Search customers..."
                    emptyText="No customers"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sale-display-mode">Product Details Display</Label>
                  <Select
                    value={productDetailsDisplayMode}
                    onValueChange={(value) => setProductDetailsDisplayMode(value as ProductDetailsDisplayMode)}
                  >
                    <SelectTrigger id="sale-display-mode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PRODUCT_DETAILS_DISPLAY_MODE.CUSTOMER_SKU}>
                        Customer SKU
                      </SelectItem>
                      <SelectItem value={PRODUCT_DETAILS_DISPLAY_MODE.COMPANY_SKU}>
                        Company SKU
                      </SelectItem>
                      <SelectItem value={PRODUCT_DETAILS_DISPLAY_MODE.PRODUCT_NAME}>
                        Product Name
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">How products appear on invoice</p>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <p className="text-sm">Subtotal</p>
                  <p className="text-sm">{formatCurrency(subtotal)}</p>
                </div>

                {selectedContact && !taxTypeAutoSet && (
                  <div className="grid gap-2">
                    <Label htmlFor="sale-tax-type">Tax Type</Label>
                    <Select
                      value={taxType}
                      onValueChange={(value) => setTaxType(value as TaxType)}
                    >
                      <SelectTrigger id="sale-tax-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cgst_sgst">Intra-state (CGST + SGST)</SelectItem>
                        <SelectItem value="igst">Inter-state (IGST)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      No GSTIN on contact — select manually
                    </p>
                  </div>
                )}

                <div>
                  <div className="grid gap-2">
                    <Label htmlFor="sale-gst">GST %</Label>
                    <div className="relative">
                      <Input
                        id="sale-gst"
                        type="number"
                        disabled={hasPerLineRates}
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        step={0.5}
                        className="pr-8"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                    {hasPerLineRates && (
                      <p className="text-sm text-muted-foreground">
                        Each item is taxed at its own GST % (set in the items table)
                      </p>
                    )}
                  </div>
                  {hasPerLineRates ? (
                    <div className="mt-1">
                      {[...rateBreakdown.entries()]
                        .sort((a, b) => b[0] - a[0])
                        .map(([rate, bucket]) => (
                          <span key={rate} className="block text-xs text-muted-foreground">
                            {taxType === 'cgst_sgst'
                              ? `CGST ${(rate / 2).toFixed(2)}% + SGST ${(rate / 2).toFixed(2)}% on ${formatCurrency(bucket.taxable)}: ${formatCurrency(bucket.tax)}`
                              : `IGST ${rate.toFixed(2)}% on ${formatCurrency(bucket.taxable)}: ${formatCurrency(bucket.tax)}`}
                          </span>
                        ))}
                    </div>
                  ) : (
                    taxPercent > 0 && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {taxType === 'cgst_sgst'
                          ? `CGST: ${formatCurrency(taxAmount / 2)} + SGST: ${formatCurrency(taxAmount / 2)}`
                          : `IGST: ${formatCurrency(taxAmount)}`}
                      </span>
                    )
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sale-discount">Discount Amount</Label>
                  <Input
                    id="sale-discount"
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                  />
                </div>

                <Separator />

                <div className="flex justify-between">
                  <h3 className="text-base font-semibold">Total</h3>
                  <h3 className="text-base font-semibold text-primary">
                    {formatCurrency(totalAmount)}
                  </h3>
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="sale-paid">Amount Paid Now</Label>
                  <Input
                    id="sale-paid"
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={totalAmount}
                    step={0.01}
                  />
                </div>

                {paidAmount > 0 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="sale-payment-method">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                      >
                        <SelectTrigger id="sale-payment-method" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PAYMENT_METHODS).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method.replace('_', ' ').toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="sale-payment-reference">Payment Reference</Label>
                      <Input
                        id="sale-payment-reference"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Check #, UPI ID, etc."
                      />
                    </div>
                  </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="sale-notes">Notes</Label>
                  <Textarea
                    id="sale-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="mt-2 flex justify-between">
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p
                    className={
                      totalAmount - paidAmount > 0
                        ? 'font-semibold text-destructive'
                        : 'font-semibold text-success'
                    }
                  >
                    {formatCurrency(totalAmount - paidAmount)}
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createSaleMutation.isPending || items.length === 0 || !selectedContact}
                >
                  {createSaleMutation.isPending ? 'Creating...' : 'Create Sale'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateSalePage;
